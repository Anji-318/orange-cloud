package jiamin.chen.orangecloud.ui.snippets

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import jiamin.chen.orangecloud.core.auth.AuthRepository
import jiamin.chen.orangecloud.core.auth.Scopes
import jiamin.chen.orangecloud.data.model.Snippet
import jiamin.chen.orangecloud.data.repository.SnippetRepository
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// MARK: - 列表

data class SnippetsUiState(
    val zoneName: String = "",
    val snippets: List<Snippet> = emptyList(),
    val isLoading: Boolean = false,
    val hasError: Boolean = false,
    val missingScope: Boolean = false,
    val canWrite: Boolean = false,
)

@HiltViewModel
class SnippetsViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val snippetRepository: SnippetRepository,
    authRepository: AuthRepository,
) : ViewModel() {

    private val zoneId: String = checkNotNull(savedStateHandle["zoneId"])
    private val hasRead = authRepository.hasScope(Scopes.SNIPPETS_READ)
    private val canWrite = authRepository.hasScope(Scopes.SNIPPETS_WRITE)

    private val _uiState = MutableStateFlow(
        SnippetsUiState(
            zoneName = savedStateHandle.get<String>("zoneName").orEmpty(),
            isLoading = hasRead,
            missingScope = !hasRead,
            canWrite = canWrite,
        ),
    )
    val uiState: StateFlow<SnippetsUiState> = _uiState.asStateFlow()

    init {
        if (hasRead) load()
    }

    fun load() {
        if (!hasRead) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, hasError = false) }
            try {
                _uiState.update { it.copy(snippets = snippetRepository.list(zoneId)) }
            } catch (e: Exception) {
                _uiState.update { it.copy(hasError = true) }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }
}

// MARK: - 编辑器

sealed interface SnippetEditEvent {
    data object Saved : SnippetEditEvent
    data object Deleted : SnippetEditEvent
    data object RuleSaved : SnippetEditEvent
    data class Error(val message: String?) : SnippetEditEvent
}

data class SnippetEditUiState(
    val name: String = "",
    val code: String = "",
    val isNew: Boolean = false,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val canWrite: Boolean = false,
)

@HiltViewModel
class SnippetEditorViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val snippetRepository: SnippetRepository,
    authRepository: AuthRepository,
) : ViewModel() {

    private val zoneId: String = checkNotNull(savedStateHandle["zoneId"])
    private val initialName: String = savedStateHandle.get<String>("name").orEmpty()
    private val canWrite = authRepository.hasScope(Scopes.SNIPPETS_WRITE)

    private val _uiState = MutableStateFlow(
        SnippetEditUiState(
            name = initialName,
            isNew = initialName.isEmpty(),
            isLoading = initialName.isNotEmpty(),
            canWrite = canWrite,
        ),
    )
    val uiState: StateFlow<SnippetEditUiState> = _uiState.asStateFlow()

    private val eventChannel = Channel<SnippetEditEvent>(Channel.BUFFERED)
    val events: Flow<SnippetEditEvent> = eventChannel.receiveAsFlow()

    private val _rules = MutableStateFlow<List<jiamin.chen.orangecloud.data.model.SnippetRule>>(emptyList())
    val rules: StateFlow<List<jiamin.chen.orangecloud.data.model.SnippetRule>> = _rules.asStateFlow()

    /** zone 下全部规则（含其他 snippet 的），整组回写时必须原样带上，否则会被 PUT 清掉。 */
    private var allRules: List<jiamin.chen.orangecloud.data.model.SnippetRule> = emptyList()

    private val _isSavingRule = MutableStateFlow(false)
    val isSavingRule: StateFlow<Boolean> = _isSavingRule.asStateFlow()

    init {
        if (initialName.isNotEmpty()) {
            viewModelScope.launch {
                val code = runCatching { snippetRepository.content(zoneId, initialName) }.getOrNull().orEmpty()
                _uiState.update { it.copy(code = code, isLoading = false) }
            }
            viewModelScope.launch {
                allRules = runCatching { snippetRepository.rules(zoneId) }.getOrNull().orEmpty()
                _rules.value = allRules.filter { it.snippetName == initialName }
            }
        }
    }

    /** 新增/编辑/删除本 snippet 的规则：在本副本上改，再连同其他 snippet 的规则整组回写。 */
    fun saveRule(existing: jiamin.chen.orangecloud.data.model.SnippetRule?, expression: String, description: String, enabled: Boolean) {
        if (!canWrite || expression.isBlank()) return
        val name = if (initialName.isNotEmpty()) initialName else _uiState.value.name.trim()
        if (name.isBlank()) return
        viewModelScope.launch {
            _isSavingRule.value = true
            try {
                val mine = allRules.filter { it.snippetName == name }.toMutableList()
                if (existing != null) mine.remove(existing)
                mine += jiamin.chen.orangecloud.data.model.SnippetRule(
                    snippetName = name,
                    expression = expression.trim(),
                    description = description.trim().ifEmpty { null },
                    enabled = enabled,
                )
                commitRules(allRules.filter { it.snippetName != name } + mine)
                eventChannel.send(SnippetEditEvent.RuleSaved)
            } catch (e: Exception) {
                eventChannel.send(SnippetEditEvent.Error(e.message))
            } finally {
                _isSavingRule.value = false
            }
        }
    }

    fun deleteRule(rule: jiamin.chen.orangecloud.data.model.SnippetRule) {
        if (!canWrite) return
        viewModelScope.launch {
            _isSavingRule.value = true
            try {
                commitRules(allRules - rule)
                eventChannel.send(SnippetEditEvent.RuleSaved)
            } catch (e: Exception) {
                eventChannel.send(SnippetEditEvent.Error(e.message))
            } finally {
                _isSavingRule.value = false
            }
        }
    }

    private suspend fun commitRules(next: List<jiamin.chen.orangecloud.data.model.SnippetRule>) {
        snippetRepository.putRules(
            zoneId,
            next.map {
                jiamin.chen.orangecloud.data.model.SnippetRuleInput(
                    snippetName = it.snippetName,
                    expression = it.expression,
                    description = it.description,
                    enabled = it.enabled ?: true,
                )
            },
        )
        // 回写成功后刷新，拿回服务端生成的 id
        allRules = runCatching { snippetRepository.rules(zoneId) }.getOrNull() ?: next
        val name = if (initialName.isNotEmpty()) initialName else _uiState.value.name.trim()
        _rules.value = allRules.filter { it.snippetName == name }
    }

    fun updateName(name: String) = _uiState.update { it.copy(name = name) }
    fun updateCode(code: String) = _uiState.update { it.copy(code = code) }

    fun save() {
        val s = _uiState.value
        if (!canWrite || s.name.isBlank()) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            try {
                snippetRepository.put(zoneId, s.name.trim(), s.code)
                eventChannel.send(SnippetEditEvent.Saved)
            } catch (e: Exception) {
                eventChannel.send(SnippetEditEvent.Error(e.message))
            } finally {
                _uiState.update { it.copy(isSaving = false) }
            }
        }
    }

    fun delete() {
        val s = _uiState.value
        if (!canWrite || s.isNew) return
        viewModelScope.launch {
            try {
                snippetRepository.delete(zoneId, s.name)
                eventChannel.send(SnippetEditEvent.Deleted)
            } catch (e: Exception) {
                eventChannel.send(SnippetEditEvent.Error(e.message))
            }
        }
    }
}

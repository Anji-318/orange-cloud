package jiamin.chen.orangecloud.ui.snippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.TextButton
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import jiamin.chen.orangecloud.R
import jiamin.chen.orangecloud.core.design.LocalBottomBarInset
import jiamin.chen.orangecloud.core.design.SkyBackground
import jiamin.chen.orangecloud.core.design.SkyEmptyState
import jiamin.chen.orangecloud.core.design.SkyHeader
import jiamin.chen.orangecloud.core.design.onSky
import jiamin.chen.orangecloud.core.design.rememberSkyPhase
import jiamin.chen.orangecloud.core.design.theme.OcOrange
import jiamin.chen.orangecloud.ui.storage.StorageRow

@Composable
fun SnippetsListScreen(
    onBack: () -> Unit,
    onOpenSnippet: (String) -> Unit,
    onCreate: () -> Unit,
    viewModel: SnippetsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val phase = rememberSkyPhase()
    val onSky = phase.onSky

    SkyBackground(phase = phase) {
        Box(Modifier.fillMaxSize().statusBarsPadding()) {
            Column(Modifier.fillMaxSize()) {
                SkyHeader(
                    title = stringResource(R.string.snippets_title),
                    onSky = onSky,
                    isLoading = state.isLoading,
                    onRefresh = { viewModel.load() },
                    onBack = onBack,
                    titleSize = 22,
                    backDescription = stringResource(R.string.common_back),
                    refreshDescription = stringResource(R.string.common_refresh),
                )
                when {
                    state.missingScope ->
                        SkyEmptyState(Icons.Outlined.Lock, stringResource(R.string.scope_missing), onSky, stringResource(R.string.common_refresh)) { viewModel.load() }

                    state.snippets.isEmpty() && state.isLoading ->
                        Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(color = onSky) }

                    state.snippets.isEmpty() && state.hasError ->
                        SkyEmptyState(Icons.Outlined.Code, stringResource(R.string.error_generic), onSky, stringResource(R.string.common_refresh)) { viewModel.load() }

                    state.snippets.isEmpty() ->
                        SkyEmptyState(Icons.Outlined.Code, stringResource(R.string.snippets_empty), onSky, stringResource(R.string.common_refresh)) { viewModel.load() }

                    else -> LazyColumn(
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = (8.dp) + LocalBottomBarInset.current),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        items(state.snippets, key = { it.snippetName }) { snippet ->
                            StorageRow(Icons.Outlined.Code, snippet.snippetName, onClick = { onOpenSnippet(snippet.snippetName) })
                        }
                    }
                }
            }
            if (state.canWrite) {
                FloatingActionButton(
                    onClick = onCreate,
                    containerColor = OcOrange,
                    contentColor = Color.White,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                ) {
                    Icon(Icons.Outlined.Add, contentDescription = stringResource(R.string.snippets_new))
                }
            }
        }
    }
}

@Composable
fun SnippetEditorScreen(
    onBack: () -> Unit,
    onClosed: () -> Unit,
    viewModel: SnippetEditorViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val phase = rememberSkyPhase()
    val onSky = phase.onSky
    val snackbarHostState = remember { SnackbarHostState() }
    val savedMsg = stringResource(R.string.dns_saved)
    val deletedMsg = stringResource(R.string.dns_deleted)
    val genericErr = stringResource(R.string.error_generic)

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                SnippetEditEvent.Saved -> { snackbarHostState.showSnackbar(savedMsg); onClosed() }
                SnippetEditEvent.Deleted -> { snackbarHostState.showSnackbar(deletedMsg); onClosed() }
                SnippetEditEvent.RuleSaved -> snackbarHostState.showSnackbar(savedMsg)
                is SnippetEditEvent.Error -> snackbarHostState.showSnackbar(event.message ?: genericErr)
            }
        }
    }

    SkyBackground(phase = phase) {
        Box(Modifier.fillMaxSize().statusBarsPadding()) {
            Column(Modifier.fillMaxSize()) {
                SkyHeader(
                    title = if (state.isNew) stringResource(R.string.snippets_new) else state.name,
                    onSky = onSky,
                    isLoading = state.isLoading || state.isSaving,
                    onRefresh = {},
                    onBack = onBack,
                    titleSize = 20,
                    backDescription = stringResource(R.string.common_back),
                )
                Column(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp).padding(bottom = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    if (state.isNew) {
                        OutlinedTextField(
                            value = state.name,
                            onValueChange = viewModel::updateName,
                            label = { Text(stringResource(R.string.snippets_name)) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    OutlinedTextField(
                        value = state.code,
                        onValueChange = viewModel::updateCode,
                        label = { Text(stringResource(R.string.snippets_code)) },
                        textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
                        modifier = Modifier.fillMaxWidth().weight(1f),
                    )
                    val rules by viewModel.rules.collectAsStateWithLifecycle()
                    val isSavingRule by viewModel.isSavingRule.collectAsStateWithLifecycle()
                    var editingRule by remember { mutableStateOf<Pair<jiamin.chen.orangecloud.data.model.SnippetRule?, Boolean>?>(null) }
                    if (rules.isNotEmpty() || state.canWrite) {
                        androidx.compose.material3.Surface(
                            color = MaterialTheme.colorScheme.surfaceContainerLow,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(stringResource(R.string.snippets_rules, rules.size), fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                                    if (state.canWrite && !state.isNew) {
                                        TextButton(onClick = { editingRule = null to true }) {
                                            Text(stringResource(R.string.snippets_rule_add))
                                        }
                                    }
                                }
                                rules.forEach { rule ->
                                    Spacer(Modifier.height(6.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Column(Modifier.weight(1f)) {
                                            Text(rule.expression, fontSize = 12.sp, fontFamily = FontFamily.Monospace, color = MaterialTheme.colorScheme.onSurface)
                                            val meta = buildString {
                                                if (rule.enabled == false) append("· disabled")
                                                rule.description?.takeIf { it.isNotBlank() }?.let { append(" · ").append(it) }
                                            }.removePrefix("· ")
                                            if (meta.isNotEmpty()) {
                                                Text(meta, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            }
                                        }
                                        if (state.canWrite) {
                                            TextButton(onClick = { editingRule = rule to true }, enabled = !isSavingRule) {
                                                Text(stringResource(R.string.snippets_rule_edit_label))
                                            }
                                            TextButton(onClick = { viewModel.deleteRule(rule) }, enabled = !isSavingRule) {
                                                Text(stringResource(R.string.dns_delete), color = MaterialTheme.colorScheme.error)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // 规则编辑弹窗（新建/编辑共用）
                    editingRule?.let { (rule, _) ->
                        var expr by remember(rule) { mutableStateOf(rule?.expression.orEmpty()) }
                        var desc by remember(rule) { mutableStateOf(rule?.description.orEmpty()) }
                        var enabled by remember(rule) { mutableStateOf(rule?.enabled ?: true) }
                        androidx.compose.material3.AlertDialog(
                            onDismissRequest = { editingRule = null },
                            title = { Text(stringResource(if (rule == null) R.string.snippets_rule_add else R.string.snippets_rule_edit_label)) },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    OutlinedTextField(
                                        value = expr,
                                        onValueChange = { expr = it },
                                        label = { Text(stringResource(R.string.snippets_rule_expression)) },
                                        placeholder = { Text(stringResource(R.string.snippets_rule_expression_hint)) },
                                        textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedTextField(
                                        value = desc,
                                        onValueChange = { desc = it },
                                        label = { Text(stringResource(R.string.snippets_rule_desc)) },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(stringResource(R.string.snippets_rule_enabled), modifier = Modifier.weight(1f))
                                        androidx.compose.material3.Switch(checked = enabled, onCheckedChange = { enabled = it })
                                    }
                                }
                            },
                            confirmButton = {
                                TextButton(
                                    onClick = {
                                        viewModel.saveRule(rule, expr, desc, enabled)
                                        editingRule = null
                                    },
                                    enabled = expr.isNotBlank() && !isSavingRule,
                                ) { Text(stringResource(R.string.dns_save)) }
                            },
                            dismissButton = {
                                TextButton(onClick = { editingRule = null }) { Text(stringResource(R.string.common_cancel)) }
                            },
                        )
                    }
                    if (state.canWrite) {
                        Button(
                            onClick = viewModel::save,
                            enabled = state.name.isNotBlank() && !state.isSaving && !state.isLoading,
                            colors = ButtonDefaults.buttonColors(containerColor = OcOrange, contentColor = Color.White),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            if (state.isSaving) {
                                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = Color.White)
                                Spacer(Modifier.width(8.dp))
                            }
                            Text(stringResource(R.string.dns_save))
                        }
                        if (!state.isNew) {
                            OutlinedButton(onClick = viewModel::delete, modifier = Modifier.fillMaxWidth()) {
                                Text(stringResource(R.string.dns_delete))
                            }
                        }
                    } else {
                        Text(stringResource(R.string.snippets_readonly), color = onSky.copy(alpha = 0.7f), fontSize = 13.sp)
                    }
                }
            }
            SnackbarHost(snackbarHostState, modifier = Modifier.align(Alignment.BottomCenter))
        }
    }
}

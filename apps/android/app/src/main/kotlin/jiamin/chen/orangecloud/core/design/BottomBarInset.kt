package jiamin.chen.orangecloud.core.design

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.unit.dp

/**
 * 悬浮胶囊底栏（Dock）占用的高度：从窗口底部一直到胶囊顶边。
 *
 * 内容区现在铺满整个窗口，页面内容可以滑到 Dock 下方（Dock 是透明底板，内容会透出来，
 * 系统状态栏 / 导航栏的玻璃条也才有东西可模糊）。
 * 但列表最后一项不能压在 Dock 的图标上，所以各页面的滚动容器必须在「滚动内容」里
 * 留出这段高度：
 *
 *   // Column + verticalScroll
 *   Modifier.verticalScroll(state).padding(bottom = LocalBottomBarInset.current)
 *
 *   // LazyColumn
 *   contentPadding = PaddingValues(bottom = (8.dp + LocalBottomBarInset.current) + LocalBottomBarInset.current)
 *
 * 注意必须加在滚动容器「之后」（即作用于滚动内容）；加在之前只会缩小视口，等于没改。
 */
val LocalBottomBarInset = compositionLocalOf { 0.dp }

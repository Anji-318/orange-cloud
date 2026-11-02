package jiamin.chen.orangecloud.ui.root

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import jiamin.chen.orangecloud.core.design.theme.LocalIsDark

/**
 * Telegram 风格底部导航条：悬浮圆角胶囊 + 投影 + 紧凑间距。
 *
 * 与系统 NavigationBar 的差别：
 *  - 整条离屏浮起（左右各留 12dp），四角全圆，投影压在内容之上
 *  - 选中项在胶囊内再套一个圆角药丸（浅色高亮），图标与文字同步变色
 *  - 项目间距压到 2dp，靠 weight 均分，视觉更紧凑但单块可点区域不变小
 */
@Composable
internal fun TgBottomBar(
    selected: TopDestination,
    onSelect: (TopDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    val cs = MaterialTheme.colorScheme
    val isDark = LocalIsDark.current
    val shape = RoundedCornerShape(28.dp)
    Surface(
        modifier = modifier
            .fillMaxWidth()
            // 浮在系统导航栏（手势条 / 三键）之上，避免被系统按键压住
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(horizontal = 12.dp, vertical = 8.dp)
            // 玻璃胶囊：浅色留一道轻投影勾出悬浮感；深色不加投影
            // （深色下投影几乎不可见，只会糊出一条硬边），
            // 靠半透明底 + 描边分层
            .shadow(
                elevation = if (isDark) 0.dp else 8.dp,
                shape = shape,
                clip = false,
            ),
        shape = shape,
        // 半透明底：胶囊不再是实心色块，页面背景（晨昏天景）从底下透上来。
        // 深色用 68%、浅色 86%——再低就会跟背景糊成一片，胶囊边界读不出来。
        color = cs.surfaceContainerHigh.copy(alpha = if (isDark) 0.68f else 0.86f),
        // 一圈极淡描边模拟玻璃边缘高光：没有它，半透明胶囊在浅色页面上会「消失」
        border = BorderStroke(
            width = 1.dp,
            color = if (isDark) Color.White.copy(alpha = 0.10f) else Color.Black.copy(alpha = 0.06f),
        ),
        tonalElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TopDestination.entries.forEach { dest ->
                TgBottomBarItem(
                    dest = dest,
                    selected = dest == selected,
                    onClick = { onSelect(dest) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

/** 单个导航项：选中态浅色药丸 + 主色图标文字，未选中态次级色。 */
@Composable
private fun TgBottomBarItem(
    dest: TopDestination,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val cs = MaterialTheme.colorScheme
    val isDark = LocalIsDark.current
    val tint = if (selected) cs.primary else cs.onSurfaceVariant
    val interaction = remember { MutableInteractionSource() }
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            // 选中药丸：浅色用 primaryContainer 淡染；深色改用亮橙淡染——
            // 深色下 primaryContainer 是深棕，叠在深色胶囊上会糊成一团脏色
            .background(
                if (selected) {
                    if (isDark) cs.primary.copy(alpha = 0.20f)
                    else cs.primaryContainer.copy(alpha = 0.55f)
                } else {
                    Color.Transparent
                }
            )
            // 去掉涟漪：药丸底色已经表达了选中态，再叠一层涟漪会显脏
            .clickable(interactionSource = interaction, indication = null) { onClick() }
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            imageVector = dest.icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.height(3.dp))
        Text(
            text = stringResource(dest.labelRes),
            color = tint,
            fontSize = 10.sp,
            maxLines = 1,
            softWrap = false,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

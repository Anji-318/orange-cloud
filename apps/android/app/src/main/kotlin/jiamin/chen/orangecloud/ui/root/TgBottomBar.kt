package jiamin.chen.orangecloud.ui.root

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import jiamin.chen.orangecloud.core.design.theme.LocalIsDark

/**
 * 悬浮胶囊导航栏（不透明实色版）：
 * - 不透明实色底板：页面内容不会透过底栏，底栏区域始终是实心的一块；
 * - 无任何立体阴影（shadowElevation / tonalElevation 均为 0）；
 * - 仅保留 1dp 描边作为视觉边界；
 * - 系统导航栏区域由 OrangeCloudRoot 底部的玻璃条接管，上下风格统一。
 */
@Composable
internal fun TgBottomBar(
    selected: TopDestination,
    onSelect: (TopDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isDark = LocalIsDark.current
    val shape = RoundedCornerShape(28.dp)
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars)
            // 水平留白 + 胶囊底边到系统导航栏的额外间距（垂直方向只留 bottom）。
            // 不设顶部留白：整个底栏（含 windowInsetsPadding 带来的系统导航栏高度）的实测高度，
            // 正好等于「胶囊顶边到窗口底部的距离」，内容区留白可直接用这个实测值，
            // 无需再额外加 navH，从而消除导航栏上方那条空白带。
            .padding(start = 12.dp, end = 12.dp, bottom = 6.dp),
        shape = shape,
        // 不透明实色底板：底栏区域不穿透内容（系统状态栏 / 导航栏那两条才是半透明磨砂）。
        color = if (isDark) Color(0xFF151210) else Color(0xFFFFFBF7),
        border = BorderStroke(
            width = 1.dp,
            color = if (isDark) Color.White.copy(alpha = 0.18f) else Color.Black.copy(alpha = 0.12f),
        ),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp, vertical = 4.dp),
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

/** 单个导航项：仅图标和文字变色，无任何独立背景框。 */
@Composable
private fun TgBottomBarItem(
    dest: TopDestination,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val cs = MaterialTheme.colorScheme
    val tint = if (selected) cs.primary else cs.onSurfaceVariant
    val interaction = remember { MutableInteractionSource() }
    Column(
        modifier = modifier
            .clickable(interactionSource = interaction, indication = null) { onClick() }
            .padding(vertical = 4.dp),
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
            // 收紧行高（10sp 字配 12sp 行高）并裁掉行盒上下多余的字体留白：
            // CJK 字体的 ascent/descent 远大于字面本身，不裁的话文本墨迹下方会空出一大截，
            // 视觉上就是「图标距上边距小、文本距下边距大」，很别扭。
            // 裁掉之后上下留白完全由 padding 决定，才能真正做到上下一致。
            lineHeight = 12.sp,
            maxLines = 1,
            softWrap = false,
            overflow = TextOverflow.Ellipsis,
            style = LocalTextStyle.current.copy(
                lineHeightStyle = LineHeightStyle(
                    alignment = LineHeightStyle.Alignment.Center,
                    trim = LineHeightStyle.Trim.Both,
                ),
            ),
        )
    }
}

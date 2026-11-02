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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import jiamin.chen.orangecloud.core.design.theme.LocalIsDark

/**
 * 悬浮胶囊导航栏：
 * - 纯净半透明底色，整个胶囊通体一致，绝无任何局部选中色块切断。
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
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .shadow(
                elevation = if (isDark) 0.dp else 6.dp,
                shape = shape,
                clip = false,
            ),
        shape = shape,
        color = cs.surfaceContainerHigh.copy(alpha = if (isDark) 0.82f else 0.94f),
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

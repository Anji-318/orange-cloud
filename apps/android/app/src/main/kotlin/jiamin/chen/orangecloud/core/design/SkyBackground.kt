package jiamin.chen.orangecloud.core.design

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalWindowInfo
import jiamin.chen.orangecloud.core.design.theme.LocalIsDark
import jiamin.chen.orangecloud.core.design.theme.OcOrange

/**
 * M3 / Material You Expressive 屏背景（对齐 UI 稿 screen.css `.and-screen`）：
 * 暖 surface 之上叠两道极淡径向辉光——右上橙 12%、左上橄榄 8%。
 *
 * **渐变几何按「窗口」尺寸计算，而不是本组件被裁剪后的绘制区域。**
 * 外层铺满窗口的背景垫层与页面自身的背景层尺寸不同（后者被底栏 padding 裁掉一段），
 * 若各按自身尺寸算渐变，两层在底栏上沿会错位出一条接缝；统一按窗口算则完全重合。
 *
 * 深色模式下辉光降到 7% / 4.5% 并收紧半径：深底上 12% 的橙色半径铺满全屏，
 * 会把上半屏染成浑浊的褐色，是"深色模式难看"的主因之一。
 *
 * 保留 `phase` 形参以兼容既有调用（明暗已由 MaterialTheme colorScheme 接管，故此处不再用相位）。
 */
@Composable
fun SkyBackground(
    phase: SkyPhase,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit = {},
) {
    val surface = MaterialTheme.colorScheme.surface
    val tertiary = MaterialTheme.colorScheme.tertiary
    val isDark = LocalIsDark.current
    val orangeAlpha = if (isDark) 0.07f else 0.12f
    val tertiaryAlpha = if (isDark) 0.045f else 0.08f
    val orangeRadius = if (isDark) 1.0f else 1.2f
    val tertiaryRadius = if (isDark) 0.9f else 1.1f
    val windowSize = LocalWindowInfo.current.containerSize
    Box(
        modifier = modifier
            .fillMaxSize()
            .drawBehind {
                // 窗口尺寸（px）。LocalWindowInfo 在预览/测试环境可能为 0，退回本组件绘制区域。
                val winW = if (windowSize.width > 0) windowSize.width.toFloat() else size.width
                val winH = if (windowSize.height > 0) windowSize.height.toFloat() else size.height
                drawRect(surface)
                drawRect(
                    Brush.radialGradient(
                        colors = listOf(OcOrange.copy(alpha = orangeAlpha), Color.Transparent),
                        center = Offset(winW, 0f),
                        radius = winW * orangeRadius,
                    ),
                )
                drawRect(
                    Brush.radialGradient(
                        colors = listOf(tertiary.copy(alpha = tertiaryAlpha), Color.Transparent),
                        center = Offset(0f, winH * 0.02f),
                        radius = winW * tertiaryRadius,
                    ),
                )
            },
    ) {
        content()
    }
}

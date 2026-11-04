package jiamin.chen.orangecloud.core.design.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeEffectScope
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.HazeTint

/**
 * 全链路毛玻璃支持。
 *
 * 用法（两步）：
 *  1. 内容根容器登记为模糊源： Modifier.hazeSource(LocalHazeState.current)
 *  2. 玻璃层消费： Modifier.hazeEffect(LocalHazeState.current) { glassStyle(isDark) }
 *
 * 重要：模糊源只能包含「页面内容」，绝不能把玻璃层自己（胶囊底栏 / 状态栏条）圈进去。
 * 否则玻璃会把自己的图标、文字也一起模糊进来 —— 图标行发暗、图标与文字之间露出
 * 一条发亮的横带（浅色下就是那条突兀的白带），深色下则和导航文字直接叠字。
 */
val LocalHazeState = staticCompositionLocalOf { HazeState() }

/**
 * 玻璃层统一样式：半透明磨砂，深浅色分开调。
 *
 * Haze 的绘制顺序是： backgroundColor（最底层）→ 模糊后的源内容（覆盖在其上）→ tints（最上层）。
 * 所以半透明的 backgroundColor 会被不透明的模糊结果完全盖住 —— 只设它等于「纯模糊」，
 * 背后的页面卡片/文字会原样透出。玻璃的「实体感」必须由 tints 承担：它是画在模糊结果
 * 之上的一层半透明玻璃色，这才是「不透明」的那一层。
 * 遮盖度取值（系统状态栏 / 系统导航栏玻璃条专用）：
 * 这两条上面只压着系统图标，不需要靠高遮盖度去遮页面卡片。
 * 遮盖度一旦接近不透明（早先是 0xB3 = 70% + 不透明底色），
 * 磨砂就会被彻底压成一条死白带，和「压根没做磨砂」在视觉上毫无区别 ——
 * 半透明磨砂的前提就是「透得出底下的颜色」。
 * 压到 35% 才能真正看出「背景被磨砂 + 仍然半透明」。
 */
fun HazeEffectScope.glassStyle(isDark: Boolean) {
    // 兜底底色：源内容没覆盖到的区域，以及 API < 31 无 RenderEffect 走 scrim 时显示它。
    // 22% -> 12%：更透，几乎只剩一层薄雾。
    backgroundColor = if (isDark) Color(0x1F14110E) else Color(0x1FFBF6EF)
    // 玻璃实体色：半透明玻璃色叠在模糊结果之上（tints 用 BlendMode SRC_IN，alpha 直接生效）。
    // 25% -> 15%：遮盖度再降一档，背后的卡片/文字能真正「隐约可见」，而不是被压成一条色带。
    tints = listOf(
        HazeTint(
            color = if (isDark) Color(0x26151210) else Color(0x26FFFBF7),
        ),
    )
    // 40dp -> 24dp：太糊会看不出背后是什么，降到 24dp 保留轮廓，才叫「隐约可见」。
    blurRadius = 24.dp
    // 颗粒感回调一档：0.20 在更透的底色上会显得脏。
    noiseFactor = 0.12f
}

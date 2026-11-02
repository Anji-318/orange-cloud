package jiamin.chen.orangecloud.core.design.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import dev.chrisbanes.haze.HazeEffectScope
import dev.chrisbanes.haze.HazeState

/**
 * 全链路毛玻璃支持。
 *
 * 用法（两步）：
 *  1. 内容根容器登记为模糊源： Modifier.hazeSource(LocalHazeState.current)
 *  2. 玻璃层消费： Modifier.hazeEffect(LocalHazeState.current) { glassStyle(isDark) }
 *
 * 背景色交给 hazeEffect 的 backgroundColor（半透明叠色），
 * 玻璃容器自身用 Color.Transparent，避免两层 alpha 相乘发灰。
 */
val LocalHazeState = staticCompositionLocalOf { HazeState() }

/** 玻璃层统一样式：半透明叠色 + 底部高光，深浅色分开调。 */
fun HazeEffectScope.glassStyle(isDark: Boolean) {
    backgroundColor = if (isDark) Color(0xD912100D) else Color(0xB3FBF6EF)
    // 想要更"毛"：把 alpha 压到 0.55~0.70 之间试；
    // 想要更亮：给 tint 加一道极淡的 primary 高光。
    // tints 顺序 = 先模糊后叠色，别在这里再叠一层实色，否则又变回"上半透下半不透"。
}
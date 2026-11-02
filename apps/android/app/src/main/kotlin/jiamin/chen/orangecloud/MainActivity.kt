package jiamin.chen.orangecloud

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import jiamin.chen.orangecloud.core.auth.AuthRepository
import jiamin.chen.orangecloud.core.auth.OAuthConfig
import jiamin.chen.orangecloud.core.design.theme.OrangeCloudTheme
import jiamin.chen.orangecloud.core.purchase.BillingGateway
import jiamin.chen.orangecloud.core.purchase.RedeemOutcome
import jiamin.chen.orangecloud.core.system.AppAppearance
import jiamin.chen.orangecloud.core.system.AppPrefs
import jiamin.chen.orangecloud.ui.root.OrangeCloudRoot
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    @Inject
    lateinit var billingGateway: BillingGateway

    @Inject
    lateinit var appPrefs: AppPrefs

    /** 已应用到窗口的底色资源，避免每次重组都重建 Drawable。 */
    private var appliedWindowBackground = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // TG 风格：状态栏 / 系统导航栏完全透明，三键/手势浮在应用内容之上。
        // 默认的 enableEdgeToEdge() 会给导航栏盖一层 0xE6 半透明遮罩
        // （浅色显灰、深色显黑），就是底栏下方那条突兀的色带。
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT,
            ),
            navigationBarStyle = SystemBarStyle.auto(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT,
            ),
        )
        // 三键导航下系统会强制叠一层对比度遮罩（API 29+），关掉才能真透明
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        // 窗口级毛玻璃（API 31+）：把「窗口背后的桌面」也模糊掉，
        // 冷启动 / 多任务切换时与 App 内玻璃质感一致。App 内容自身的
        // 毛玻璃由 Compose 侧 Haze 实现，与此处互补、互不影响。
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // 窗口背后模糊（API 31+，跨窗口毛玻璃）：公开 SDK 只有 blurBehindRadius 属性，
            // 设为正值即开启，无需也不存在 setBlurBehindEnabled(...) 这类方法；
            // 改完 attributes 必须回写才会生效。
            window.attributes = window.attributes.apply {
                blurBehindRadius = 40
            }
        }
        billingGateway.connect()
        handleOAuthRedirect(intent)
        handleRedeemRedirect(intent)
        setContent {
            val appearance by appPrefs.appearance.collectAsStateWithLifecycle(initialValue = AppAppearance.SYSTEM)
            val darkTheme = when (appearance) {
                AppAppearance.LIGHT -> false
                AppAppearance.DARK -> true
                AppAppearance.SYSTEM -> isSystemInDarkTheme()
            }
            OrangeCloudTheme(darkTheme = darkTheme) {
                // 状态栏 / 导航栏图标色随生效主题（而非系统），与晨昏天景对比一致
                val view = LocalView.current
                SideEffect {
                    WindowCompat.getInsetsController(window, view).apply {
                        isAppearanceLightStatusBars = !darkTheme
                        isAppearanceLightNavigationBars = !darkTheme
                    }
                    // 窗口底色必须跟随「App 生效主题」，而不是系统主题：
                    // App 内强制深色时系统可能仍是浅色，values-night 不生效，
                    // android:windowBackground 取到的还是浅色 #F5F2ED ——
                    // 系统导航栏（透明）后面就会露出一条白带，深色下尤其刺眼。
                    val bgRes = if (darkTheme) R.color.oc_window_dark else R.color.oc_window_light
                    if (bgRes != appliedWindowBackground) {
                        appliedWindowBackground = bgRes
                        window.setBackgroundDrawableResource(bgRes)
                    }
                }
                OrangeCloudRoot()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOAuthRedirect(intent)
        handleRedeemRedirect(intent)
    }

    /** 接住 Web 后端 302 跳回的 orangecloud://oauth/callback，交给 AuthRepository 验 state + 换 token。 */
    private fun handleOAuthRedirect(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != OAuthConfig.CALLBACK_SCHEME || data.host != OAuthConfig.CALLBACK_HOST) return
        lifecycleScope.launch { authRepository.handleRedirect(data) }
    }

    /** direct 风味：接住 Web 成功页的 orangecloud://redeem?code=...，兑换并提示结果（play/oss 的清单不含此 filter）。 */
    private fun handleRedeemRedirect(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "orangecloud" || data.host != "redeem") return
        val code = data.getQueryParameter("code")?.takeIf { it.isNotBlank() } ?: return
        lifecycleScope.launch {
            val msg = when (billingGateway.redeem(code)) {
                RedeemOutcome.SUCCESS -> R.string.redeem_ok
                RedeemOutcome.INVALID -> R.string.redeem_invalid
                RedeemOutcome.REVOKED -> R.string.redeem_revoked
                RedeemOutcome.DEVICE_LIMIT -> R.string.redeem_device_limit
                else -> R.string.redeem_network
            }
            Toast.makeText(this@MainActivity, msg, Toast.LENGTH_LONG).show()
        }
    }
}

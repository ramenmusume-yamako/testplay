document.addEventListener('DOMContentLoaded', () => {

    // デバッグモードかどうか
    const isDebugMode =
        localStorage.getItem('debug_mode') === 'true';

    // 今いるページが debug.html かどうか
    const isDebugPage =
        location.pathname.endsWith('/debug.html') ||
        location.pathname.endsWith('debug.html');

    // spanaボタンを取得
    const debugSpanaBtn =
        document.getElementById('debug-spana-btn');

    if (!debugSpanaBtn) return;

    // デバッグモード中 かつ debug.htmlではない場合だけ表示
    if (isDebugMode && !isDebugPage) {
        debugSpanaBtn.style.display = 'block';
    } else {
        debugSpanaBtn.style.display = 'none';
    }

});
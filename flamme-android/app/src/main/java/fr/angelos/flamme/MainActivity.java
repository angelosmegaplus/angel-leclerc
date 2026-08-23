package fr.angelos.flamme;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

public final class MainActivity extends AppCompatActivity {
    private static final String START_URL = "https://angel-leclerc.fr/flamme?source=android-app";
    private static final String PRIMARY_HOST = "angel-leclerc.fr";
    private static final String WWW_HOST = "www.angel-leclerc.fr";
    private static final String LOVABLE_HOST = "angel-leclerc.lovable.app";

    private static final int REQUEST_AUDIO = 4001;
    private static final int REQUEST_FILE = 4002;

    private FrameLayout root;
    private SwipeRefreshLayout swipeRefresh;
    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorPanel;
    private TextView errorTitle;
    private TextView errorMessage;

    private PermissionRequest pendingAudioRequest;
    private ValueCallback<Uri[]> pendingFileCallback;
    private ConnectivityManager connectivityManager;
    private boolean networkCallbackRegistered;
    private boolean showingError;

    private final ConnectivityManager.NetworkCallback networkCallback = new ConnectivityManager.NetworkCallback() {
        @Override
        public void onAvailable(@NonNull Network network) {
            runOnUiThread(() -> {
                if (showingError) {
                    root.postDelayed(MainActivity.this::retryCurrentPage, 350);
                }
            });
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();
        buildUi();
        configureBackNavigation();
        registerNetworkMonitoring();

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            loadIntentOrHome(getIntent());
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        loadIntentOrHome(intent);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private WebView createConfiguredWebView() {
        WebView view = new WebView(this);
        view.setBackgroundColor(resolveBackgroundColor());
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setSafeBrowsingEnabled(true);
        settings.setUserAgentString(settings.getUserAgentString() + " FlammeAndroid/0.9");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(view, false);

        view.setWebViewClient(new FlammeWebViewClient());
        view.setWebChromeClient(new FlammeWebChromeClient());
        view.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                openExternal(Uri.parse(url));
            } catch (Exception ignored) {
                Toast.makeText(this, "Téléchargement indisponible", Toast.LENGTH_SHORT).show();
            }
        });
        return view;
    }

    private void buildUi() {
        root = new FrameLayout(this);
        root.setBackgroundColor(resolveBackgroundColor());

        swipeRefresh = new SwipeRefreshLayout(this);
        swipeRefresh.setColorSchemeColors(Color.rgb(234, 67, 53), Color.rgb(66, 133, 244));
        swipeRefresh.setOnRefreshListener(this::retryCurrentPage);

        webView = createConfiguredWebView();
        swipeRefresh.addView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        root.addView(swipeRefresh, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgress(0);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3)
        );
        progressParams.gravity = Gravity.TOP;
        root.addView(progressBar, progressParams);

        errorPanel = buildErrorPanel();
        FrameLayout.LayoutParams errorParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        root.addView(errorPanel, errorParams);
        hideError();

        setContentView(root);
    }

    private LinearLayout buildErrorPanel() {
        boolean dark = isDarkMode();
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(dp(32), dp(48), dp(32), dp(48));
        panel.setBackgroundColor(dark ? Color.rgb(32, 33, 36) : Color.WHITE);

        TextView flame = new TextView(this);
        flame.setText("●");
        flame.setTextSize(40);
        flame.setGravity(Gravity.CENTER);
        flame.setTextColor(Color.rgb(234, 67, 53));
        panel.addView(flame, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        errorTitle = new TextView(this);
        errorTitle.setText("Flamme est hors ligne");
        errorTitle.setTextSize(24);
        errorTitle.setGravity(Gravity.CENTER);
        errorTitle.setTextColor(dark ? Color.WHITE : Color.rgb(32, 33, 36));
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleParams.topMargin = dp(14);
        panel.addView(errorTitle, titleParams);

        errorMessage = new TextView(this);
        errorMessage.setText("Vérifie ta connexion puis réessaie.");
        errorMessage.setTextSize(15);
        errorMessage.setGravity(Gravity.CENTER);
        errorMessage.setTextColor(dark ? Color.rgb(189, 193, 198) : Color.rgb(95, 99, 104));
        LinearLayout.LayoutParams messageParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        messageParams.topMargin = dp(8);
        panel.addView(errorMessage, messageParams);

        Button retry = new Button(this);
        retry.setText("Réessayer");
        retry.setAllCaps(false);
        retry.setOnClickListener(v -> retryCurrentPage());
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        retryParams.topMargin = dp(22);
        panel.addView(retry, retryParams);

        return panel;
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void loadIntentOrHome(Intent intent) {
        Uri data = intent != null ? intent.getData() : null;
        if (data != null && isTrusted(data) && data.getPath() != null && data.getPath().startsWith("/flamme")) {
            webView.loadUrl(data.toString());
        } else {
            webView.loadUrl(START_URL);
        }
    }

    private boolean isTrusted(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        return PRIMARY_HOST.equals(host) || WWW_HOST.equals(host) || LOVABLE_HOST.equals(host);
    }

    private boolean handleNavigation(Uri uri) {
        if (uri == null) return true;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);

        if (isTrusted(uri)) return false;

        if ("http".equals(scheme)) {
            String host = uri.getHost();
            if (host != null && (PRIMARY_HOST.equalsIgnoreCase(host) || WWW_HOST.equalsIgnoreCase(host))) {
                Uri secure = uri.buildUpon().scheme("https").build();
                webView.loadUrl(secure.toString());
                return true;
            }
            openExternal(uri);
            return true;
        }

        if ("https".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)
                || "sms".equals(scheme) || "geo".equals(scheme) || "market".equals(scheme)) {
            openExternal(uri);
            return true;
        }

        if ("intent".equals(scheme)) {
            try {
                Intent parsed = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                if (parsed.resolveActivity(getPackageManager()) != null) {
                    startActivity(parsed);
                } else {
                    String fallback = parsed.getStringExtra("browser_fallback_url");
                    if (fallback != null) openExternal(Uri.parse(fallback));
                }
            } catch (Exception ignored) {
                Toast.makeText(this, "Lien non pris en charge", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        return true;
    }

    private void openExternal(Uri uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivity(intent);
        } else {
            Toast.makeText(this, "Aucune application ne peut ouvrir ce lien", Toast.LENGTH_SHORT).show();
        }
    }

    private void retryCurrentPage() {
        if (!isOnline()) {
            showError("Flamme est hors ligne", "Vérifie ta connexion puis réessaie.");
            swipeRefresh.setRefreshing(false);
            return;
        }

        hideError();
        String current = webView.getUrl();
        if (current == null || current.isBlank() || "about:blank".equals(current)) {
            webView.loadUrl(START_URL);
        } else {
            webView.reload();
        }
    }

    private void showError(String title, String message) {
        showingError = true;
        errorTitle.setText(title);
        errorMessage.setText(message);
        errorPanel.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.GONE);
        swipeRefresh.setRefreshing(false);
    }

    private void hideError() {
        showingError = false;
        errorPanel.setVisibility(View.GONE);
    }

    private boolean isOnline() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        Network network = manager.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    private void registerNetworkMonitoring() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        try {
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
            networkCallbackRegistered = true;
        } catch (Exception ignored) {
            networkCallbackRegistered = false;
        }
    }

    private void recoverWebView() {
        String lastUrl = webView != null ? webView.getUrl() : null;
        if (webView != null) {
            swipeRefresh.removeView(webView);
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
        }
        webView = createConfiguredWebView();
        swipeRefresh.addView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        if (lastUrl != null && isTrusted(Uri.parse(lastUrl))) {
            webView.loadUrl(lastUrl);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    private void requestAudioPermission(PermissionRequest request) {
        if (!isTrusted(request.getOrigin())) {
            request.deny();
            return;
        }

        List<String> resources = Arrays.asList(request.getResources());
        if (!resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                || resources.stream().anyMatch(resource -> !PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource))) {
            request.deny();
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            return;
        }

        if (pendingAudioRequest != null) pendingAudioRequest.deny();
        pendingAudioRequest = request;
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_AUDIO);
    }

    private void openDocumentPicker(ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams params) {
        if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
        pendingFileCallback = callback;

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);

        String[] accepts = params.getAcceptTypes();
        List<String> cleaned = new ArrayList<>();
        if (accepts != null) {
            for (String accept : accepts) {
                if (accept != null && !accept.isBlank()) cleaned.add(accept);
            }
        }
        if (cleaned.size() == 1) {
            intent.setType(cleaned.get(0));
        } else if (cleaned.size() > 1) {
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, cleaned.toArray(new String[0]));
        } else {
            intent.setType("*/*");
        }

        try {
            startActivityForResult(intent, REQUEST_FILE);
        } catch (Exception e) {
            pendingFileCallback.onReceiveValue(null);
            pendingFileCallback = null;
            Toast.makeText(this, "Sélecteur de fichiers indisponible", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_AUDIO && pendingAudioRequest != null) {
            PermissionRequest request = pendingAudioRequest;
            pendingAudioRequest = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && isTrusted(request.getOrigin())) {
                request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                request.deny();
            }
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_FILE || pendingFileCallback == null) return;

        ValueCallback<Uri[]> callback = pendingFileCallback;
        pendingFileCallback = null;

        if (resultCode != RESULT_OK || data == null) {
            callback.onReceiveValue(null);
            return;
        }

        List<Uri> uris = new ArrayList<>();
        ClipData clipData = data.getClipData();
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                Uri uri = clipData.getItemAt(i).getUri();
                if (uri != null) uris.add(uri);
            }
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        callback.onReceiveValue(uris.isEmpty() ? null : uris.toArray(new Uri[0]));
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (pendingAudioRequest != null) {
            pendingAudioRequest.deny();
            pendingAudioRequest = null;
        }
        if (pendingFileCallback != null) {
            pendingFileCallback.onReceiveValue(null);
            pendingFileCallback = null;
        }
        if (networkCallbackRegistered && connectivityManager != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {
                // Déjà désenregistré par Android.
            }
        }
        if (webView != null) {
            swipeRefresh.removeView(webView);
            webView.stopLoading();
            webView.loadUrl("about:blank");
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private void configureSystemBars() {
        boolean dark = isDarkMode();
        int background = dark ? Color.rgb(32, 33, 36) : Color.WHITE;
        getWindow().setStatusBarColor(background);
        getWindow().setNavigationBarColor(background);

        int flags = getWindow().getDecorView().getSystemUiVisibility();
        if (dark) {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
        } else {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
        }
        getWindow().getDecorView().setSystemUiVisibility(flags);
    }

    private boolean isDarkMode() {
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
    }

    private int resolveBackgroundColor() {
        return isDarkMode() ? Color.rgb(32, 33, 36) : Color.WHITE;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private final class FlammeWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleNavigation(request.getUrl());
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleNavigation(Uri.parse(url));
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            if (isOnline()) hideError();
            progressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefresh.setRefreshing(false);
            if (isOnline()) hideError();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                CharSequence description = error.getDescription();
                showError(
                        isOnline() ? "Flamme n’a pas pu charger" : "Flamme est hors ligne",
                        description == null || description.length() == 0
                                ? "Réessaie dans un instant."
                                : description.toString()
                );
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            super.onReceivedHttpError(view, request, errorResponse);
            if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
                showError("Service temporairement indisponible", "Flamme réessaiera dès que le service répondra.");
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            runOnUiThread(MainActivity.this::recoverWebView);
            return true;
        }
    }

    private final class FlammeWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            super.onProgressChanged(view, newProgress);
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            runOnUiThread(() -> requestAudioPermission(request));
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) {
            if (request == pendingAudioRequest) pendingAudioRequest = null;
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            openDocumentPicker(filePathCallback, fileChooserParams);
            return true;
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView popup = new WebView(MainActivity.this);
            popup.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageStarted(WebView child, String url, android.graphics.Bitmap favicon) {
                    super.onPageStarted(child, url, favicon);
                    try {
                        Uri uri = Uri.parse(url);
                        if (isTrusted(uri)) {
                            webView.loadUrl(uri.toString());
                        } else {
                            openExternal(uri);
                        }
                    } finally {
                        child.stopLoading();
                        child.destroy();
                    }
                }
            });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }
    }
}

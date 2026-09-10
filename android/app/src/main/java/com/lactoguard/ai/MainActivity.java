package com.lactoguard.ai;

import android.Manifest;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 101;
    private static final String PREFS_NAME = "LactoGuardPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER_URL = "http://12.10.3.159:5173";
    private static final String OFFLINE_FALLBACK_URL = "file:///android_asset/www/index.html";

    private WebView webView;
    private ProgressBar progressBar;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);

        // Request runtime microphone permission for Android 6.0+
        requestAppPermissions();

        // Setup WebView settings
        setupWebView();

        // Load the dashboard
        loadApp();
    }

    private void requestAppPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.MODIFY_AUDIO_SETTINGS
            }, PERMISSION_REQUEST_CODE);
        }
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Bridge for native controls
        webView.addJavascriptInterface(new WebAppInterface(this), "LactoGuardAndroid");

        // Custom WebChromeClient with automatic microphone permission grant
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    // Grant audio and video capture permissions requested by Web Speech & MediaRecorder
                    request.grant(request.getResources());
                });
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        // WebViewClient to handle routing and offline fallback
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; // Keep navigation inside webview
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                // Inject server URL into localStorage so app.js fetch interceptor knows the host
                String currentServer = getServerUrl();
                view.evaluateJavascript("if (!localStorage.getItem('lactoguard_server_url')) { localStorage.setItem('lactoguard_server_url', '" + currentServer + "'); }", null);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    String failingUrl = request.getUrl().toString();
                    if (!failingUrl.startsWith("file:///")) {
                        // Fallback to offline assets if Wi-Fi server is unreachable
                        Toast.makeText(MainActivity.this, "Server unreachable. Loading local offline mode...", Toast.LENGTH_SHORT).show();
                        view.loadUrl(OFFLINE_FALLBACK_URL);
                    }
                }
            }
        });
    }

    private void loadApp() {
        String serverUrl = getServerUrl();
        webView.loadUrl(serverUrl);
    }

    public String getServerUrl() {
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
    }

    public void setServerUrl(String url) {
        prefs.edit().putString(KEY_SERVER_URL, url.trim()).apply();
        runOnUiThread(this::loadApp);
    }

    public void showServerConfigDialog() {
        runOnUiThread(() -> {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle(R.string.server_url_dialog_title);

            final EditText input = new EditText(this);
            input.setText(getServerUrl());
            input.setHint(R.string.server_url_hint);
            input.setPadding(40, 30, 40, 30);
            builder.setView(input);

            builder.setPositiveButton(R.string.save, (dialog, which) -> {
                String newUrl = input.getText().toString().trim();
                if (!newUrl.isEmpty()) {
                    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                        newUrl = "http://" + newUrl;
                    }
                    setServerUrl(newUrl);
                    Toast.makeText(this, "Updated server to: " + newUrl, Toast.LENGTH_SHORT).show();
                }
            });

            builder.setNegativeButton(R.string.cancel, (dialog, which) -> dialog.cancel());

            builder.setNeutralButton("Use Offline Mode", (dialog, which) -> {
                webView.loadUrl(OFFLINE_FALLBACK_URL);
                Toast.makeText(this, "Loaded local offline mode", Toast.LENGTH_SHORT).show();
            });

            builder.show();
        });
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Microphone enabled for voice assistant!", Toast.LENGTH_SHORT).show();
            }
        }
    }

    // JavaScript Interface to interact with Native Android
    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public String getServerUrl() {
            return MainActivity.this.getServerUrl();
        }

        @JavascriptInterface
        public void setServerUrl(String url) {
            MainActivity.this.setServerUrl(url);
        }

        @JavascriptInterface
        public void configureServer() {
            MainActivity.this.showServerConfigDialog();
        }

        @JavascriptInterface
        public void showToast(String toast) {
            Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
        }
    }
}

using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace FlamingBox;

public partial class MainWindow : Window
{
    private const string HomePage = "https://www.google.com";
    private int _blockedRequests;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await CreateTabAsync(HomePage, "Accueil");
        Closing += async (_, _) => await ClearTransientDataAsync();
    }

    private WebView2? CurrentWebView => (Tabs.SelectedItem as TabItem)?.Content as WebView2;

    private async Task CreateTabAsync(string url, string title = "Nouvel onglet")
    {
        var web = new WebView2();
        var tab = new TabItem { Header = title, Content = web };
        Tabs.Items.Add(tab);
        Tabs.SelectedItem = tab;

        await web.EnsureCoreWebView2Async();
        ConfigureSecurity(web, tab);
        web.Source = SecurityPolicy.NormalizeAddress(url);
    }

    private void ConfigureSecurity(WebView2 web, TabItem tab)
    {
        var core = web.CoreWebView2;

        core.Settings.AreDevToolsEnabled = false;
        core.Settings.AreDefaultContextMenusEnabled = true;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsZoomControlEnabled = true;
        core.Settings.IsPasswordAutosaveEnabled = true;
        core.Settings.IsGeneralAutofillEnabled = true;

        core.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All);
        core.WebResourceRequested += (_, e) =>
        {
            if (Uri.TryCreate(e.Request.Uri, UriKind.Absolute, out var requestUri) && SecurityPolicy.IsTracker(requestUri))
            {
                _blockedRequests++;
                e.Response = core.Environment.CreateWebResourceResponse(null, 403, "Blocked by FlamingBox Shield", "Content-Type: text/plain");
                Dispatcher.Invoke(() => StatusText.Text = $"FlamingBox Shield — {_blockedRequests} requête(s) de pistage bloquée(s)");
            }
        };

        core.NewWindowRequested += async (_, e) =>
        {
            e.Handled = true;
            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var target)) return;

            if (SecurityPolicy.IsPaymentPopup(target))
            {
                await Dispatcher.InvokeAsync(async () => await CreateTabAsync(target.ToString(), "Paiement sécurisé"));
                StatusText.Text = "Paiement détecté : ouvert dans un onglet isolé FlamingBox.";
                return;
            }

            if (e.IsUserInitiated)
            {
                web.Source = target;
                StatusText.Text = "Pop-up supprimée : lien ouvert dans l’onglet courant.";
            }
            else
            {
                StatusText.Text = "Pop-up automatique bloquée par FlamingBox Shield.";
            }
        };

        core.PermissionRequested += (_, e) =>
        {
            e.Handled = true;
            var origin = Uri.TryCreate(e.Uri, UriKind.Absolute, out var u) ? u.Host : e.Uri;
            var result = MessageBox.Show(
                $"Le site {origin} demande l’autorisation : {e.PermissionKind}.\n\nAutoriser uniquement si tu fais confiance à ce site.",
                "FlamingBox — Autorisation sensible",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);
            e.State = result == MessageBoxResult.Yes ? CoreWebView2PermissionState.Allow : CoreWebView2PermissionState.Deny;
        };

        core.ServerCertificateErrorDetected += (_, e) =>
        {
            e.Action = CoreWebView2ServerCertificateErrorAction.Cancel;
            Dispatcher.Invoke(() => StatusText.Text = "Connexion bloquée : certificat TLS invalide.");
        };

        core.NavigationStarting += (_, e) =>
        {
            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri)) return;
            if (uri.Scheme == Uri.UriSchemeHttp)
            {
                e.Cancel = true;
                web.Source = new UriBuilder(uri) { Scheme = Uri.UriSchemeHttps, Port = -1 }.Uri;
                StatusText.Text = "HTTP remplacé automatiquement par HTTPS.";
            }
        };

        core.NavigationCompleted += (_, _) =>
        {
            AddressBox.Text = web.Source?.ToString() ?? string.Empty;
            BackButton.IsEnabled = core.CanGoBack;
            ForwardButton.IsEnabled = core.CanGoForward;
            var pageTitle = string.IsNullOrWhiteSpace(core.DocumentTitle) ? "FlamingBox" : core.DocumentTitle;
            tab.Header = pageTitle.Length > 24 ? pageTitle[..24] + "…" : pageTitle;
        };
    }

    private async Task ClearTransientDataAsync()
    {
        foreach (var item in Tabs.Items)
        {
            if (item is TabItem { Content: WebView2 web } && web.CoreWebView2 is not null)
            {
                try
                {
                    await web.CoreWebView2.Profile.ClearBrowsingDataAsync(
                        CoreWebView2BrowsingDataKinds.DiskCache |
                        CoreWebView2BrowsingDataKinds.CacheStorage);
                }
                catch { }
            }
        }
    }

    private void AddressBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key != Key.Enter || CurrentWebView is null) return;
        CurrentWebView.Source = SecurityPolicy.NormalizeAddress(AddressBox.Text);
    }

    private void Back_Click(object sender, RoutedEventArgs e)
    {
        if (CurrentWebView?.CoreWebView2?.CanGoBack == true) CurrentWebView.CoreWebView2.GoBack();
    }

    private void Forward_Click(object sender, RoutedEventArgs e)
    {
        if (CurrentWebView?.CoreWebView2?.CanGoForward == true) CurrentWebView.CoreWebView2.GoForward();
    }

    private void Reload_Click(object sender, RoutedEventArgs e) => CurrentWebView?.Reload();

    private async void NewTab_Click(object sender, RoutedEventArgs e) => await CreateTabAsync(HomePage);

    private void CloseTab_Click(object sender, RoutedEventArgs e)
    {
        if (Tabs.SelectedItem is not TabItem selected) return;
        Tabs.Items.Remove(selected);
        if (Tabs.Items.Count == 0) _ = CreateTabAsync(HomePage);
    }

    private async void GooglePasswords_Click(object sender, RoutedEventArgs e)
    {
        await CreateTabAsync("https://passwords.google.com", "Google Passwords");
        StatusText.Text = "Google Password Manager ouvert. FlamingBox ne contourne ni ne copie les identifiants Google.";
    }

    private void Tabs_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (CurrentWebView?.Source is not null) AddressBox.Text = CurrentWebView.Source.ToString();
    }
}

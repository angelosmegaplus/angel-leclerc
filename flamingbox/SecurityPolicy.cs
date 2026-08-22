using System;
using System.Collections.Generic;

namespace FlamingBox;

internal static class SecurityPolicy
{
    private static readonly HashSet<string> TrackerDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adservice.google.com", "facebook.net", "scorecardresearch.com",
        "hotjar.com", "clarity.ms", "segment.io", "segment.com",
        "taboola.com", "outbrain.com", "criteo.com", "criteo.net"
    };

    private static readonly HashSet<string> PaymentDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "paypal.com", "paypalobjects.com", "stripe.com", "checkout.com",
        "klarna.com", "adyen.com", "worldpay.com", "payplug.com",
        "mollie.com", "amazonpay.com", "payments.google.com", "pay.google.com"
    };

    public static bool IsTracker(Uri? uri)
    {
        if (uri is null) return false;
        var host = uri.Host;
        foreach (var domain in TrackerDomains)
        {
            if (host.Equals(domain, StringComparison.OrdinalIgnoreCase) || host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    public static bool IsPaymentPopup(Uri? uri)
    {
        if (uri is null) return false;
        var host = uri.Host;
        var path = uri.AbsolutePath + uri.Query;

        foreach (var domain in PaymentDomains)
        {
            if (host.Equals(domain, StringComparison.OrdinalIgnoreCase) || host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return path.Contains("checkout", StringComparison.OrdinalIgnoreCase)
            || path.Contains("payment", StringComparison.OrdinalIgnoreCase)
            || path.Contains("3ds", StringComparison.OrdinalIgnoreCase)
            || path.Contains("securepay", StringComparison.OrdinalIgnoreCase);
    }

    public static Uri NormalizeAddress(string raw)
    {
        raw = raw.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return new Uri("https://www.google.com");

        if (Uri.TryCreate(raw, UriKind.Absolute, out var absolute) &&
            (absolute.Scheme == Uri.UriSchemeHttp || absolute.Scheme == Uri.UriSchemeHttps))
        {
            if (absolute.Scheme == Uri.UriSchemeHttp)
            {
                var https = new UriBuilder(absolute) { Scheme = Uri.UriSchemeHttps, Port = -1 };
                return https.Uri;
            }
            return absolute;
        }

        if (raw.Contains('.') && !raw.Contains(' '))
            return new Uri("https://" + raw);

        return new Uri("https://www.google.com/search?q=" + Uri.EscapeDataString(raw));
    }
}

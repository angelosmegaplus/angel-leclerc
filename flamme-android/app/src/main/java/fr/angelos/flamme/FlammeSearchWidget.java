package fr.angelos.flamme;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public final class FlammeSearchWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.flamme_search_widget);

            PendingIntent homeIntent = buildPendingIntent(context, Intent.ACTION_MAIN, appWidgetId * 10);
            PendingIntent searchIntent = buildPendingIntent(context, MainActivity.ACTION_FOCUS_SEARCH, appWidgetId * 10 + 1);
            PendingIntent voiceIntent = buildPendingIntent(context, MainActivity.ACTION_VOICE_SEARCH, appWidgetId * 10 + 2);

            views.setOnClickPendingIntent(R.id.widget_logo, homeIntent);
            views.setOnClickPendingIntent(R.id.widget_search_area, searchIntent);
            views.setOnClickPendingIntent(R.id.widget_voice, voiceIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private PendingIntent buildPendingIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(action);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}

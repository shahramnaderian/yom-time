package app.yomtime.owghat;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.content.SharedPreferences;

import com.getcapacitor.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RingtonePicker")
public class RingtonePickerPlugin extends Plugin {
    private static final String PREFS = "yom_time_ringtone";
    private static final String KEY_URI = "notification_uri";
    private static final String KEY_TITLE = "notification_title";
    private static final String KEY_CHANNEL = "notification_channel";

    @PluginMethod
    public void pickNotificationRingtone(PluginCall call) {
        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Choose alarm sound");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_DEFAULT_URI,
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION));
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, 0);
        String current = prefs.getString(KEY_URI, null);
        if (current != null) intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(current));
        startActivityForResult(call, intent, "ringtonePickerResult");
    }

    @ActivityCallback
    private void ringtonePickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != android.app.Activity.RESULT_OK || result.getData() == null) {
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }
        Uri uri = result.getData().getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
        if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        android.media.Ringtone ringtone = uri == null ? null : RingtoneManager.getRingtone(getContext(), uri);
        String title = ringtone == null ? "Default notification" : ringtone.getTitle(getContext());
        String uriText = uri == null ? "" : uri.toString();
        String channelId = createSoundChannel(uri, title);
        getContext().getSharedPreferences(PREFS, 0).edit()
            .putString(KEY_URI, uriText).putString(KEY_TITLE, title).putString(KEY_CHANNEL, channelId).apply();
        JSObject ret = new JSObject();
        ret.put("cancelled", false);
        ret.put("title", title);
        ret.put("uri", uriText);
        ret.put("channelId", channelId);
        call.resolve(ret);
    }

    @PluginMethod
    public void getSelectedRingtone(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, 0);
        String uriText = prefs.getString(KEY_URI, "");
        String title = prefs.getString(KEY_TITLE, "Default notification");
        String channelId = prefs.getString(KEY_CHANNEL, "");
        if (channelId.isEmpty()) {
            Uri uri = uriText.isEmpty() ? RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION) : Uri.parse(uriText);
            channelId = createSoundChannel(uri, title);
            prefs.edit().putString(KEY_CHANNEL, channelId).apply();
        }
        JSObject ret = new JSObject();
        ret.put("selected", !uriText.isEmpty());
        ret.put("title", title);
        ret.put("channelId", channelId);
        call.resolve(ret);
    }

    private String createSoundChannel(Uri uri, String title) {
        String key = uri == null ? "default-notification" : uri.toString();
        String suffix = Integer.toHexString(key.hashCode());
        String channelId = "prayer-user-sound-" + suffix;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getContext().getSystemService(NotificationManager.class);
            if (manager != null && manager.getNotificationChannel(channelId) == null) {
                NotificationChannel channel = new NotificationChannel(channelId,
                    "Yom Time · " + title, NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Selected phone sound for Yom Time alarms");
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
                channel.setSound(uri, attrs);
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }
        }
        return channelId;
    }
}

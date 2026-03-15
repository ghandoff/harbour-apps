import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Speech from 'expo-speech';
import { useFocusEffect } from 'expo-router';
import { members, type Member } from '@/src/lib/members';
import { get_member_id, set_member_id, get_voice_id, set_voice_id } from '@/src/lib/storage';
import { get_status, get_oauth_url, type ConnectionStatus } from '@/src/api/status';
import { get_available_voices, type Voice } from '@/src/hooks/use-tts';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// --- voice commands reference ---

const command_groups = [
  {
    title: 'capture',
    commands: [
      { intent: 'note', emoji: '📝', examples: ['"note that the API uses v3 endpoints"', '"remember to check the deploy logs"'] },
      { intent: 'idea', emoji: '💡', examples: ['"i have an idea for a voice-controlled deploy flow"', '"idea: what if we add a daily standup summary"'] },
      { intent: 'task', emoji: '✅', examples: ['"assign a task to lamis: review the PR"', '"create a high priority task: fix the auth bug"'] },
    ],
  },
  {
    title: 'slack',
    commands: [
      { intent: 'check messages', emoji: '💬', examples: ['"check slack"', '"any new messages?"'] },
      { intent: 'send message', emoji: '📨', examples: ['"message garrett: the deploy is ready"', '"tell lamis the branch is merged"'] },
      { intent: 'reply', emoji: '↩️', examples: ['"reply to garrett: sounds good, let\'s ship it"'] },
    ],
  },
  {
    title: 'code & deploy',
    commands: [
      { intent: 'code request', emoji: '💻', examples: ['"tell claude to add error handling to the voice endpoint"', '"code request: refactor the intent router"'] },
      { intent: 'deploy', emoji: '🔨', examples: ['"approve the build"', '"deploy to production"'] },
    ],
  },
  {
    title: 'control',
    commands: [
      { intent: 'exit', emoji: '👋', examples: ['"stop"', '"goodbye"', '"that\'s all"'] },
    ],
  },
];

// --- component ---

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];

  const [selected, set_selected] = useState<string | null>(null);
  const [show_commands, set_show_commands] = useState(false);
  const [status, set_status] = useState<ConnectionStatus | null>(null);
  const [status_loading, set_status_loading] = useState(false);
  const [connecting, set_connecting] = useState(false);

  // voice selection
  const [voices, set_voices] = useState<Voice[]>([]);
  const [selected_voice, set_selected_voice] = useState<string | null>(null);
  const [show_voices, set_show_voices] = useState(false);
  const [previewing_voice, set_previewing_voice] = useState<string | null>(null);

  useEffect(() => {
    get_member_id().then(set_selected);
    get_voice_id().then(set_selected_voice);
    get_available_voices().then(set_voices);
  }, []);

  // fetch connection status when member changes or screen regains focus
  const load_status = useCallback(async (member_id: string | null) => {
    if (!member_id) { set_status(null); return; }
    set_status_loading(true);
    try {
      const s = await get_status(member_id);
      set_status(s);
    } catch (err) {
      console.warn('[settings] status fetch failed:', err);
      set_status(null);
    } finally {
      set_status_loading(false);
    }
  }, []);

  // re-check status every time the tab comes into focus (after returning from browser oauth)
  useFocusEffect(
    useCallback(() => {
      if (selected) load_status(selected);
    }, [selected, load_status])
  );

  const handle_select = async (member: Member) => {
    set_selected(member.id);
    await set_member_id(member.id);
    load_status(member.id);
  };

  const handle_voice_select = async (voice: Voice) => {
    set_selected_voice(voice.identifier);
    await set_voice_id(voice.identifier);
  };

  const handle_voice_preview = (voice: Voice) => {
    Speech.stop();
    set_previewing_voice(voice.identifier);
    Speech.speak('hey — i\'m pocket.prompts. anything you need?', {
      voice: voice.identifier,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      onDone: () => set_previewing_voice(null),
      onError: () => set_previewing_voice(null),
      onStopped: () => set_previewing_voice(null),
    });
  };

  const handle_connect_slack = async () => {
    if (!selected) return;
    set_connecting(true);
    try {
      const url = await get_oauth_url(selected);
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[settings] oauth url failed:', err);
    } finally {
      set_connecting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* member selection */}
      <Text style={[styles.section_label, { color: colors.textSecondary }]}>
        member
      </Text>
      <Text style={[styles.section_desc, { color: colors.textSecondary }]}>
        select your name to route voice commands to your accounts
      </Text>

      <View style={styles.member_list}>
        {members.map((m) => {
          const is_selected = selected === m.id;
          return (
            <Pressable
              key={m.id}
              style={[
                styles.member_row,
                {
                  backgroundColor: is_selected ? colors.accent + '15' : colors.surface,
                  borderColor: is_selected ? colors.accent : colors.surfaceBorder,
                },
              ]}
              onPress={() => handle_select(m)}
            >
              <View style={styles.member_info}>
                <Text style={[styles.member_name, { color: colors.text }]}>
                  {m.id}
                </Text>
                <Text style={[styles.member_email, { color: colors.textSecondary }]}>
                  {m.email}
                </Text>
              </View>
              {is_selected && (
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  tintColor={colors.accent}
                  size={22}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* connections */}
      {selected && (
        <View style={styles.connections_section}>
          <Text style={[styles.section_label, { color: colors.textSecondary }]}>
            connections
          </Text>
          <Text style={[styles.section_desc, { color: colors.textSecondary }]}>
            connect accounts so voice commands act as you
          </Text>

          <View style={[styles.conn_card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {/* slack row */}
            <View style={styles.conn_row}>
              <View style={styles.conn_info}>
                <Text style={[styles.conn_provider, { color: colors.text }]}>slack</Text>
                {status_loading ? (
                  <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 2 }} />
                ) : status?.slack ? (
                  <Text style={[styles.conn_detail, { color: colors.success }]}>
                    {status.slack_token_type === 'user'
                      ? 'connected — messages as you'
                      : 'connected — messages as bot'}
                  </Text>
                ) : (
                  <Text style={[styles.conn_detail, { color: colors.textSecondary }]}>
                    not connected
                  </Text>
                )}
              </View>

              {status?.slack && status.slack_token_type === 'user' ? (
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  tintColor={colors.success}
                  size={22}
                />
              ) : (
                <Pressable
                  style={[styles.conn_btn, { backgroundColor: colors.accent }]}
                  onPress={handle_connect_slack}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.conn_btn_text}>
                      {status?.slack ? 'reconnect' : 'connect'}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            {/* notion row */}
            <View style={[styles.conn_row, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.surfaceBorder }]}>
              <View style={styles.conn_info}>
                <Text style={[styles.conn_provider, { color: colors.text }]}>notion</Text>
                <Text style={[styles.conn_detail, { color: colors.success }]}>shared token</Text>
              </View>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                tintColor={colors.success}
                size={22}
              />
            </View>
          </View>
        </View>
      )}

      {/* voice selection */}
      <View style={styles.voice_section}>
        <Pressable
          style={styles.commands_header}
          onPress={() => set_show_voices(!show_voices)}
        >
          <View>
            <Text style={[styles.section_label, { color: colors.textSecondary }]}>
              voice
            </Text>
            <Text style={[styles.section_desc, { color: colors.textSecondary, marginBottom: 0 }]}>
              {selected_voice
                ? voices.find(v => v.identifier === selected_voice)?.name || 'custom voice'
                : 'system default'}
            </Text>
          </View>
          <SymbolView
            name={{
              ios: show_voices ? 'chevron.up' : 'chevron.down',
              android: show_voices ? 'expand_less' : 'expand_more',
              web: show_voices ? 'expand_less' : 'expand_more',
            }}
            tintColor={colors.textSecondary}
            size={18}
          />
        </Pressable>

        {show_voices && (
          <View style={styles.voice_list}>
            {/* system default option */}
            <Pressable
              style={[
                styles.voice_row,
                {
                  backgroundColor: !selected_voice ? colors.accent + '15' : colors.surface,
                  borderColor: !selected_voice ? colors.accent : colors.surfaceBorder,
                },
              ]}
              onPress={async () => {
                set_selected_voice(null);
                await set_voice_id('');
              }}
            >
              <View style={styles.voice_info}>
                <Text style={[styles.voice_name, { color: colors.text }]}>
                  system default
                </Text>
              </View>
              {!selected_voice && (
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  tintColor={colors.accent}
                  size={20}
                />
              )}
            </Pressable>

            {voices.map((voice) => {
              const is_selected = selected_voice === voice.identifier;
              const is_previewing = previewing_voice === voice.identifier;
              return (
                <Pressable
                  key={voice.identifier}
                  style={[
                    styles.voice_row,
                    {
                      backgroundColor: is_selected ? colors.accent + '15' : colors.surface,
                      borderColor: is_selected ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => handle_voice_select(voice)}
                >
                  <View style={styles.voice_info}>
                    <Text style={[styles.voice_name, { color: colors.text }]}>
                      {voice.name}
                    </Text>
                    <Text style={[styles.voice_detail, { color: colors.textSecondary }]}>
                      {voice.language}{voice.quality !== 'default' ? ` · ${voice.quality.toLowerCase()}` : ''}
                    </Text>
                  </View>

                  <View style={styles.voice_actions}>
                    {/* preview button */}
                    <Pressable
                      onPress={() => handle_voice_preview(voice)}
                      style={[styles.preview_btn, { backgroundColor: colors.surfaceBorder }]}
                    >
                      <SymbolView
                        name={{
                          ios: is_previewing ? 'stop.fill' : 'play.fill',
                          android: is_previewing ? 'stop' : 'play_arrow',
                          web: is_previewing ? 'stop' : 'play_arrow',
                        }}
                        tintColor={colors.text}
                        size={14}
                      />
                    </Pressable>

                    {is_selected && (
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor={colors.accent}
                        size={20}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}

            {voices.length === 0 && (
              <Text style={[styles.voice_empty, { color: colors.textSecondary }]}>
                no voices available on this device
              </Text>
            )}
          </View>
        )}
      </View>

      {/* voice commands cheat sheet */}
      <View style={styles.commands_section}>
        <Pressable
          style={styles.commands_header}
          onPress={() => set_show_commands(!show_commands)}
        >
          <View>
            <Text style={[styles.section_label, { color: colors.textSecondary }]}>
              voice commands
            </Text>
            <Text style={[styles.section_desc, { color: colors.textSecondary, marginBottom: 0 }]}>
              things you can say to pocket.prompts
            </Text>
          </View>
          <SymbolView
            name={{
              ios: show_commands ? 'chevron.up' : 'chevron.down',
              android: show_commands ? 'expand_less' : 'expand_more',
              web: show_commands ? 'expand_less' : 'expand_more',
            }}
            tintColor={colors.textSecondary}
            size={18}
          />
        </Pressable>

        {show_commands && (
          <View style={styles.commands_body}>
            {command_groups.map((group) => (
              <View key={group.title} style={styles.cmd_group}>
                <Text style={[styles.cmd_group_title, { color: colors.accent }]}>
                  {group.title}
                </Text>
                {group.commands.map((cmd) => (
                  <View
                    key={cmd.intent}
                    style={[styles.cmd_item, { borderColor: colors.surfaceBorder }]}
                  >
                    <View style={styles.cmd_label_row}>
                      <Text style={styles.cmd_emoji}>{cmd.emoji}</Text>
                      <Text style={[styles.cmd_intent, { color: colors.text }]}>
                        {cmd.intent}
                      </Text>
                    </View>
                    {cmd.examples.map((ex, i) => (
                      <Text
                        key={i}
                        style={[styles.cmd_example, { color: colors.textSecondary }]}
                      >
                        {ex}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footer_text, { color: colors.textSecondary }]}>
          pocket.prompts v1.0.0
        </Text>
        <Text style={[styles.footer_text, { color: colors.textSecondary }]}>
          winded.vertigo collective
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  // shared section labels
  section_label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  section_desc: {
    fontSize: 13,
    marginBottom: 16,
  },

  // member list
  member_list: {
    gap: 8,
  },
  member_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  member_info: {
    flex: 1,
  },
  member_name: {
    fontSize: 16,
    fontWeight: '600',
  },
  member_email: {
    fontSize: 13,
    marginTop: 2,
  },

  // connections section
  connections_section: {
    marginTop: 32,
  },
  conn_card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  conn_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  conn_info: {
    flex: 1,
    gap: 2,
  },
  conn_provider: {
    fontSize: 15,
    fontWeight: '600',
  },
  conn_detail: {
    fontSize: 12,
  },
  conn_btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  conn_btn_text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // voice section
  voice_section: {
    marginTop: 32,
  },
  voice_list: {
    marginTop: 12,
    gap: 6,
  },
  voice_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  voice_info: {
    flex: 1,
    gap: 1,
  },
  voice_name: {
    fontSize: 14,
    fontWeight: '600',
  },
  voice_detail: {
    fontSize: 12,
  },
  voice_actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  preview_btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voice_empty: {
    fontSize: 13,
    textAlign: 'center',
    padding: 16,
  },

  // commands section
  commands_section: {
    marginTop: 32,
  },
  commands_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commands_body: {
    marginTop: 12,
    gap: 20,
  },
  cmd_group: {
    gap: 6,
  },
  cmd_group_title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cmd_item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 4,
  },
  cmd_label_row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cmd_emoji: {
    fontSize: 14,
  },
  cmd_intent: {
    fontSize: 14,
    fontWeight: '600',
  },
  cmd_example: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingLeft: 22,
  },

  // footer
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footer_text: {
    fontSize: 12,
  },
});

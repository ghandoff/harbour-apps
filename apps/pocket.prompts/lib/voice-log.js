import { Client } from '@notionhq/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const members = require('../config/members.json');

const shared_log_db_id = (process.env.NOTION_VOICE_LOG_DB_ID || '').trim();

function get_log_db_id(user_id) {
  if (user_id && members[user_id]?.voice_log_db_id) {
    return members[user_id].voice_log_db_id;
  }
  return shared_log_db_id;
}

/**
 * Log a voice interaction to the Notion Voice Log database.
 * Fire-and-forget — never throws, never blocks the voice response.
 */
export async function log_voice_interaction({
  utterance,
  intent_result,
  action_taken,
  spoken_response,
  entry_url,
  user_id,
  error,
  duration_ms,
  request_id,
  timestamp,
  platform
}) {
  const log_db_id = get_log_db_id(user_id);
  if (!log_db_id) {
    console.log('[voice-log] no voice log db id for user or env, skipping');
    return;
  }

  const is_personal = log_db_id !== shared_log_db_id;

  try {
    const notion = new Client({ auth: (process.env.NOTION_API_KEY || '').trim() });

    // personal db: use raw utterance as title (private, no sanitization needed)
    // shared db: sanitize title to hide raw utterance for privacy
    const title = is_personal
      ? (utterance || `${intent_result?.intent || 'unknown'} — ${user_id || 'anonymous'}`)
      : [intent_result?.intent || 'unknown', user_id || 'anonymous'].join(' — ');

    const properties = {
      utterance: {
        title: [{ text: { content: title } }]
      }
    };

    // store raw utterance + spoken response for chat view
    // (title field stays sanitized for shared DB browsing)
    if (utterance) {
      const raw = utterance.length > 2000 ? utterance.substring(0, 1997) + '...' : utterance;
      properties.content = {
        rich_text: [{ text: { content: raw } }]
      };
    }
    if (spoken_response) {
      const sr = spoken_response.length > 2000 ? spoken_response.substring(0, 1997) + '...' : spoken_response;
      properties.spoken_response = {
        rich_text: [{ text: { content: sr } }]
      };
    }

    // only add properties that have values (Notion rejects null selects)
    if (intent_result?.intent) {
      properties.intent = { select: { name: intent_result.intent } };
    }
    if (intent_result?.confidence != null) {
      properties.confidence = { number: intent_result.confidence };
    }
    if (action_taken) {
      properties.action_taken = { select: { name: action_taken } };
    }
    // NOTE: content and spoken_response intentionally omitted from shared log
    // for privacy. the actual content is accessible via the created notion
    // entries (entry_url) or slack messages.
    if (intent_result?.priority) {
      properties.priority = { select: { name: intent_result.priority } };
    }
    if (entry_url) {
      properties.entry_url = { url: entry_url };
    }
    if (user_id || request_id) {
      // append request_id to user_id field for dedup diagnosis
      const user_str = [user_id, request_id].filter(Boolean).join(' | ');
      properties.user_id = {
        rich_text: [{ text: { content: user_str } }]
      };
    }
    if (error) {
      properties.error = {
        rich_text: [{ text: { content: error.substring(0, 2000) } }]
      };
    }
    if (duration_ms != null) {
      properties.duration_ms = { number: duration_ms };
    }
    if (timestamp) {
      properties.timestamp = { date: { start: timestamp } };
    }
    if (platform) {
      properties.platform = { select: { name: platform } };
    }

    await notion.pages.create({
      parent: { database_id: log_db_id },
      properties
    });

    console.log('[voice-log] interaction logged');
  } catch (err) {
    // never let logging break the voice pipeline
    console.error(`[voice-log] failed: ${err.message}`);
  }
}

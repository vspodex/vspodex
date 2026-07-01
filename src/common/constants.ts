export const PRESET_COLORS = [
  "#737373",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];

/**
 * Default list of VSPO channel IDs and their Twitch logins.
 * This list is updated at runtime via the Holodex API.
 */
export const DEFAULT_VSPO_CHANNELS: Array<{ id: string; name: string; english_name: string; group: string; twitch?: string | null }> = [
  { id: "UCyLGcqYs7RsBb3L0SJfzGYA", name: "花芽すみれ", english_name: "Sumire Kaga", group: "VSPO", twitch: "kagasumire" },
  { id: "UCiMG6VdScBabPhJ1ZtaVmbw", name: "花芽なずな", english_name: "Nazuna Kaga", group: "VSPO", twitch: "nazunakaga" },
  { id: "UCgTzsBI0DIRopMylJEDqnog", name: "小雀とと", english_name: "Toto Kogara", group: "VSPO", twitch: "toto_kogara" },
  { id: "UC5LyYg6cCA4yHEYvtUsir3g", name: "一ノ瀬うるは", english_name: "Uruha Ichinose", group: "VSPO", twitch: "uruhaichinose" },
  { id: "UCIcAj6WkJ8vZ7DeJVgmeqKw", name: "胡桃のあ", english_name: "Noa Kurumi", group: "VSPO", twitch: "963noah" },
  { id: "UCvUc0m317LWTTPZoBQV479A", name: "橘ひなの", english_name: "Hinano Tachibana", group: "VSPO", twitch: "hinanotachiba7" },
  { id: "UCD5W21JqNMv_tV9nfjvF9sw", name: "紫宮るな", english_name: "Runa Shinomiya", group: "VSPO", twitch: "shinomiya_runa" },
  { id: "UCurEA8YoqFwimJcAuSHU0MQ", name: "英リサ", english_name: "Lisa Hanabusa", group: "VSPO", twitch: "lisahanabusa" },
  { id: "UCMp55EbT_ZlqiMS3lCj01BQ", name: "神成きゅぴ", english_name: "Kyupi Kaminari", group: "VSPO", twitch: "kaminariqpi" },
  { id: "UCjXBuHmWkieBApgBhDuJMMQ", name: "八雲べに", english_name: "Beni Yakumo", group: "VSPO", twitch: "yakumobeni" },
  { id: "UCPkKpOHxEDcwmUAnRpIu-Ng", name: "藍沢エマ", english_name: "Ema Aizawa", group: "VSPO", twitch: "emtsmaru" },
  { id: "UCF_U2GCKHvDz52jWdizppIA", name: "空澄セナ", english_name: "Sena Asumi", group: "VSPO", twitch: "asumisena" },
  { id: "UCGWa1dMU_sDCaRQjdabsVgg", name: "如月れん", english_name: "Ren Kisaragi", group: "VSPO", twitch: "ren_kisaragi__" },
];

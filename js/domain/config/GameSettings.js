// js/domain/config/GameSettings.js
export const FEATURE_FLAGS = {
    ENABLE_ENGLISH_PUZZLE: true,       // Bật/tắt toàn bộ hệ thống giải đố Tiếng Anh
    ENABLE_WEED_TYPING_MINIGAME: true,  // Bật/tắt minigame gõ chữ để diệt cỏ dại
    REQUIRE_WATERING: true,             // Bật/tắt yêu cầu tưới nước bắt buộc để cây lớn
    ENABLE_DAY_NIGHT_CYCLE: false       // Bật/tắt chu kỳ ngày đêm (tùy chọn mở rộng)
};

export const GAME_BALANCING = {
    INITIAL_GOLD: 100,
    INITIAL_ENERGY: 100,
    MAX_ENERGY: 100,
    ENERGY_RECOVER_RATE: 0.1, // Hồi năng lượng mỗi giây
    WEED_GROW_CHANCE: 0.05,   // Tỷ lệ mọc cỏ dại mỗi chu kỳ
    TICK_RATE: 1000           // Tần suất cập nhật logic nông trại (ms)
};

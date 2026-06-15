# AI DEVELOPMENT HISTORY (AI_DEV_HISTORY.md)

Tài liệu này ghi nhận lịch sử phát triển, kế hoạch triển khai và kết quả thực hiện các giai đoạn của **Game Nông Trại V3**, tuân thủ nghiêm ngặt quy tắc ghi nhận lịch sử phát triển Chương 1 trong `rules.md`.

---

## PLAN_CHUONG1_1: Thiết lập cấu hình và các thực thể cốt lõi (Giai đoạn 1)

### Mục tiêu
Khởi tạo cơ sở hạ tầng cho game bao gồm:
1. Tạo tệp cấu hình Feature Flags `js/domain/config/GameSettings.js`.
2. Tạo các thực thể Entities nghiệp vụ trong `js/domain/models/`: `Player.js`, `Plot.js`, `Crop.js`.
3. Khởi tạo `js/infra/SoundSystem.js` quản lý Web Audio API Node Graph, BGM & SFX.
4. Khởi tạo `js/adapters/AssetPresenter.js` quản lý tải mô hình GLB, căn chỉnh Pivot động và đăng ký hoạt cảnh Wind Sway / Growth.
5. Tạo `js/main.js` để làm điểm bắt đầu (entry point) liên kết các hệ thống này và tích hợp chúng với Viewer Three.js sẵn có (`js/viewer.js`).

### Kế hoạch chi tiết từng bước
1. **Bước 1**: Tạo thư mục `js/domain/config/`, `js/domain/models/`, `js/usecases/actions/`, `js/adapters/`, `js/infra/` nếu chưa có.
2. **Bước 2**: Tạo file `js/domain/config/GameSettings.js` chứa cờ Feature Flags.
3. **Bước 3**: Tạo các file thực thể domain:
   - `Player.js`: Quản lý vàng, năng lượng, túi đồ.
   - `Crop.js`: Quản lý loại cây, giai đoạn phát triển, trạng thái được tưới nước, tiến độ sinh trưởng.
   - `Plot.js`: Quản lý ô đất, vị trí grid, thực thể Crop trên ô đất, trạng thái đất (cỏ/đất cày xới).
4. **Bước 4**: Tạo file `js/infra/SoundSystem.js` xây dựng Audio Graph với MasterGain, BGMGain, SFXGain, AmbienceGain và hỗ trợ Positional Audio 3D thông qua PannerNode.
5. **Bước 5**: Tạo file `js/adapters/AssetPresenter.js` tích hợp GLTFLoader, nạp trước (preload) và cache các mô hình, hỗ trợ nhân bản (clone) mô hình, dịch chuyển pivot đáy về Y=0, thu thập sway_group/leaves_group để đung đưa trước gió, và scale_group cho hoạt cảnh tăng trưởng.
6. **Bước 6**: Tạo/Cập nhật `js/main.js` để tích hợp SoundSystem và AssetPresenter vào Three.js scene trong `js/viewer.js`.
7. **Bước 7**: Cập nhật `index.html` để nạp tệp `js/main.js` dưới dạng ES Module, khởi tạo trò chơi.
8. **Bước 8**: Kiểm thử chạy thử để đảm bảo hệ thống không bị lỗi cú pháp, Web Audio khởi tạo thành công khi click chuột và AssetPresenter tải được các mô hình mẫu.

---

## _THUCHIEN_CHUONG1_1: Hoàn thành tích hợp Farming & English Typing Puzzle (Giai đoạn 1)

### Kết quả thực hiện
1. **Khởi tạo Game Settings & Domain Models**:
   - `js/domain/config/GameSettings.js` cấu hình đầy đủ Feature Flags (ENABLE_ENGLISH_PUZZLE, ENABLE_WEED_TYPING_MINIGAME, REQUIRE_WATERING).
   - Thiết lập các lớp nghiệp vụ thuần túy: `Player.js` (quản lý gold, energy, inventory), `Crop.js` (quản lý growth progress/stage, watered), và `Plot.js` (quản lý grid position, crop, weed).
2. **Xây dựng SoundSystem & AssetPresenter**:
   - `js/infra/SoundSystem.js` thiết lập Web Audio graph (Master, BGM, SFX, Ambience gains) hỗ trợ preloading âm thanh và positional stereo PannerNode đồng bộ với camera.
   - `js/adapters/AssetPresenter.js` hỗ trợ dynamic pivot offset (Y=0, X=0, Z=0 center), standard scaling cho model keys, leaves wind sway, và growth scale transition.
3. **Orchestrator `js/main.js` & Giao diện `index.html`**:
   - Viết `js/main.js` quản lý logic game, tải tài nguyên 3D/audio, khởi tạo 9 ô đất (3x3 grid), tự động spawn weeds với từ vựng tiếng Anh ngẫu nhiên, quản lý minigame gõ chữ diệt cỏ dại, mua bán hạt giống và thu hoạch nông sản.
   - Cập nhật `index.html` để nạp `js/main.js` như một ES Module, xây dựng bảng điều khiển HUD (Gold, Energy), tab chuyển đổi Farming/Shop, và minigame gõ chữ tiếng Anh trực quan.
   - Tích hợp thành công SoundSystem listener & AssetPresenter update loop vào `animate()` trong `js/viewer.js`.
4. **Tối ưu hóa UI/UX & Hotkeys theo phản hồi**:
   - Thiết kế lại tỷ lệ các vật thể (phóng to người/động vật lên 6.0, thu nhỏ barn/silo xuống 2.2/1.8 để cân đối cảnh quan).
   - Thiết lập hệ thống phím tắt hotkeys (1,2,3 chọn hạt giống; P cuốc đất; L gieo hạt; K tưới nước; H thu hoạch) hỗ trợ thao tác nhanh không cần nhấn chuột.
   - Xây dựng hệ thống Collapsible Sidebar Panel ẩn/hiện thông qua nút hamburger (🍔) giúp giao diện gọn gàng, tăng diện tích thao tác 3D.
   - Tích hợp Raycast cho phép click trực tiếp vào mô hình 3D (Merchant, Seed Seller, Barn) trên Scene để tự động mở tab Cửa hàng (Shop).

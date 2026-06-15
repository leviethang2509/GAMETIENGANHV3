# CHAPTER 2 GOALS: OBJECTIVES, IMPLEMENTATION, AND DEVELOPMENT HISTORY

Tài liệu này ghi nhận Kế hoạch - Mục tiêu - Thực hiện - Lịch sử phát triển của Chương 2: Tương tác Nâng cao & Môi trường Game. Mục đích là để làm tư liệu lưu trữ và tái sử dụng sau này.

---

## I. MỤC TIÊU CẦN ĐẠT ĐƯỢC (OBJECTIVES)
Chương 2 tập trung vào việc hoàn thiện cấu trúc tương tác và tinh chỉnh môi trường thế giới 3D. Các mục tiêu cụ thể gồm:

1. **Nạp & Hiển thị Mô hình môi trường:**
   * Nạp trước và hiển thị mô hình `compostbin` tại vị trí `(15, height, -25)` trên địa hình.
   * Nạp trước và hiển thị mô hình `waterpump` tại vị trí `(-15, height, -28)` trên địa hình.
   * Đảm bảo cả hai mô hình có tỉ lệ scale là `15.0` để hiển thị cân đối với nhân vật và môi trường.
   * Cài đặt độ cao bám đất tự động qua hàm `getTerrainHeight(x, z)`.

2. **Cấu hình & Liên kết Bảng điều khiển (Settings Panel Wiring):**
   * Ô chọn thời tiết (`#settings-select-weather`): Liên kết sự kiện thay đổi (`change`) để gọi `terrainSystem.setWeather(mode)`.
   * Ô chọn thời gian (`#settings-select-time`): Liên kết sự kiện thay đổi (`change`) để gọi `terrainSystem.setTimeOfDay(time)`.
   * Nút bật/tắt âm thanh (`#btn-toggle-sound`): Gọi `soundSystem.toggleMute()` và thay đổi nhãn nút động hiển thị trạng thái "Mute Sound" hoặc "Unmute Sound".
   * Nút cổng nông trại (`#settings-btn-toggle-gate`): Gọi `terrainSystem.toggleGate()` và thay đổi nhãn nút hiển thị "Open (Mở)" hoặc "Closed (Đóng)".
   * Nút đặt lại camera (`#settings-btn-reset-pos`): Trực tiếp đặt camera về tọa độ `(0, 150, 250)` và `controls.target` về `(0, 0, 0)`.

3. **Cơ chế click NPC mở Sidebar Shop (Raycasting Triggers):**
   * Raycast phát hiện click chuột vào mô hình `npc_seedseller` (hoặc các NPC/công trình shop).
   * Tự động mở rộng sidebar (loại bỏ class `collapsed` khỏi `#sidebar-panel`) và chuyển tab sang "Shop" (`switchTab('shop')`).

4. **Dọn dẹp và Tinh chỉnh giao diện UI (UI Layout Polish):**
   * Loại bỏ toàn bộ các nút hamburger menu lỗi thời hoặc trùng lặp chức năng.
   * Căn giữa thanh kỹ năng `.skills-wheel-container` nằm hoàn toàn theo chiều ngang ở đáy màn hình.
   * Cải tổ giao diện Cozy Farm (#sidebar-panel) từ dạng thanh bên trượt thành một bảng vuông modal nằm giữa màn hình (kích thước 500x500px), đi kèm nút đóng thủ công (❌).
   * Thêm cơ chế tự động ẩn Cozy Farm panel khi người dùng đổi tab trình duyệt (sự kiện `visibilitychange`) hoặc khi cửa sổ mất tập trung (sự kiện `blur`).

---

## II. KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION PLAN)

1. **Tích hợp & Spawn mô hình:**
   * Cập nhật `glbAssets` trong `js/main.js` để nạp tệp `compostbin.glb` và `waterpump.glb`.
   * Cập nhật mapping scale trong `js/adapters/AssetPresenter.js` thành `15.0`.
   * Viết logic spawn hai mô hình trong `js/main.js` sau khi địa hình và presenter sẵn sàng, tính Y bằng `getTerrainHeight(x, z)`.

2. **Kết nối bảng điều khiển:**
   * Viết mã trong `js/main.js` tại phương thức `setupUIEventHandlers()` để liên kết các selectors và buttons của bảng settings.
   * Triển khai hàm `toggleMute()` trong `js/infra/SoundSystem.js` để điều khiển tắt mở gain node tổng thể.

3. **Raycasting & Click Triggers:**
   * Cải tiến bộ raycast trong `js/main.js` (`setupModelClickRaycaster()`) để nhận diện chính xác khi click trúng mesh con của NPC `seedseller`.
   * Gọi hàm `switchTab('shop')` và chỉnh sửa DOM của sidebar để xóa class `collapsed`.

4. **UI/CSS Polish:**
   * Sửa file `style.css` để dàn hàng ngang `.skills-wheel-container` bằng Flexbox và căn giữa đáy canvas.
   * Xóa bỏ các nút hamburger không dùng tới khỏi `index.html`.

---

## III. GHI NHẬN THỰC HIỆN & LỊCH SỬ (DEVELOPMENT & REUSE HISTORY)

### 1. Ghi nhận Thực hiện (Execution Log)
* **Status**: ĐÃ HOÀN THÀNH TOÀN BỘ (COMPLETED)
* **Chi tiết thay đổi:**
  * **Asset Scaling:** Cập nhật tỉ lệ scale của `compostbin` và `waterpump` lên `15.0` trong `AssetPresenter.js`.
  * **Spawning:** Spawner tĩnh trong `js/main.js` đã được viết để nạp và định vị `compostbin` tại `(15, height, -25)` và `waterpump` tại `(-15, height, -28)`.
  * **Settings Controls:** Sự kiện `change` của `#settings-select-weather` và `#settings-select-time` đã được nối với `terrainSystem`. Nút mute âm thanh được nối với `soundSystem.toggleMute()`. Nút toggle gate được nối với `terrainSystem.toggleGate()`. Nút reset camera khôi phục vị trí camera và target của controls.
  * **NPC Raycasting:** Raycast click chuột trong `js/main.js` được nâng cấp để bắt click mô hình `seedseller` (gồm cả mesh bọc trong group). Khi click trúng, sidebar mở rộng (`collapsed` removed) và tab chuyển sang `shop`.
  * **UI & Style:** Sidebar thu gọn mặc định trên tải trang. Xóa bỏ hamburger buttons trùng lặp. Container `.skills-wheel-container` được sửa thành Flexbox ngang và căn giữa chính xác ở đáy canvas viewer.
  * **Cozy Farm Centered Panel:** Thay đổi thiết kế từ thanh bên trượt (sidebar) sang bảng vuông modal căn giữa màn hình (500x500px), hỗ trợ nút đóng thủ công và tự động ẩn khi chuyển tab hoặc mất focus.

### 2. Hướng dẫn tái sử dụng (Reuse & References)
* **Để spawn mô hình tĩnh mới**:
  1. Thêm key và đường dẫn GLB vào `glbAssets` trong `js/main.js`.
  2. Định nghĩa scale trong `AssetPresenter.js` -> `this.scaleMappings`.
  3. Lấy chiều cao địa hình qua `getTerrainHeight(x, z)` và spawn instance qua `assetPresenter.createModelInstance()`.
* **Để thêm nút cấu hình môi trường mới**:
  1. Thêm phần tử HTML vào `#settings-panel`.
  2. Ràng buộc listener trong `setupUIEventHandlers()` của `js/main.js`.
  3. Gọi phương thức tương ứng trên `terrainSystem` hoặc `soundSystem`.
* **Để bắt click chuột 3D**:
  1. Thêm tên thực thể (hoặc id của mesh) vào cấu trúc kiểm tra va chạm trong `setupModelClickRaycaster()`.
  2. Xử lý mở rộng sidebar bằng cách thao tác với class `collapsed` của `#sidebar-panel` và gọi hàm chuyển tab.

# Feature: Risk Agent & Control Tower Polish

## Goal
Cải thiện toàn diện UX/UI của trang Control Tower (Dashboard) để trở thành công cụ hỗ trợ ra quyết định vận hành hiệu quả hơn, hiển thị theo thời gian thực (real-time) tiến trình xử lý của AI Agents và tối ưu hóa luồng giao diện người dùng (giảm tải nhận thức, gom nhóm thông tin, làm rõ quy trình).

## Accomplished
- **Real-time Trace Updates**: Tích hợp cơ chế polling 500ms ở frontend (`useControlTower.ts`) kết hợp với `trace_updater` callback ở backend để liên tục cập nhật state của graph.
- **Planned Roadmap UX**: Cập nhật danh sách Planned Roadmap, giới hạn chiều cao hiển thị (`max-h-[500px]`) và thêm chức năng mở rộng/thu gọn (Compact/Expanded), mặc định hiển thị top 8 item.
- **Codebase Cleanup**: Gỡ bỏ các component trùng lặp và không cần thiết như `AgentTimeline` (đã có ở Plan Generation) và `ScenarioLab`, giúp luồng component `Agent.tsx` gọn gàng hơn.
- **Exception Queue Modal**: Chuyển đổi Exception Queue thành giao diện Popup Modal chuyên nghiệp (hỗ trợ tính năng search, filter All/Critical, lock scroll, và nhấn phím `Esc` để đóng).
- **Operator Workflow Stepper**: Tái thiết kế toàn bộ `WorkflowSection.tsx` từ dạng grid các nút thành một Stepper workflow trực quan, giúp người dùng dễ dàng theo dõi trình tự và tiến độ các bước.
- **KPI Grouping**: Cải thiện Information Hierarchy bằng cách phân nhóm rõ ràng các chỉ số KPI trong `OperationsConsole.tsx` thành 3 nhóm cốt lõi: Performance, Risk, và Cost & Efficiency.
- **Decision Flow Layout**: Chuyển đổi nửa dưới của Control Tower từ một bảng dữ liệu khô khan thành một luồng "Decision Flow" trực quan với 6 phần rõ ràng.
- **Progressive UI & Layout Optimization**: 
  - Áp dụng cấu trúc 2 cột (`lg:grid-cols-[1.4fr_1fr]`) ở desktop cho 2 khối tốn diện tích nhất là Planned Roadmap (Section 3) và Risks & Constraints (Section 4).
  - Áp dụng Inner Scroll (`max-h-[400px]` kèm `overflow-y-auto`) cho các danh sách hành động và rủi ro, giúp người dùng cuộn xem chi tiết mà không làm xô lệch cấu trúc tổng thể và không phải cuộn trang web quá nhiều, giúp Control Tower cực kỳ cô đọng.
- **System Health Relocation**: 
  - Chuyển toàn bộ dữ liệu trạng thái hệ thống (`ServiceRuntimeView`) từ `ServiceHealthPanel` (đã loại bỏ) sang góc dưới của thanh điều hướng (`Sidebar`/`Layout.tsx`).
  - Thiết kế đèn trạng thái (Status Indicator) với hiệu ứng ping và cửa sổ Popover chi tiết, giải phóng không gian quan trọng trên `OperationsConsole` và cung cấp khả năng quan sát (observability) ở mọi tab.
- **ChainCopilot Chat Interface (Plan Generation)**:
  - Tái cấu trúc toàn bộ luồng giao diện "Analysis Insight" thành mô hình "Chat Feed" (Luồng tin nhắn) cuộn dọc mang tên **ChainCopilot**.
  - Áp dụng Progressive Disclosure: Giữ phần `Summary` hiển thị đầy đủ, và giấu các thông tin chi tiết (Evidence, Impacts, Tradeoffs, Actions, Risks) vào trong các Inline Buttons dạng Accordion (có thể Expand/Collapse). Điều này khắc phục hoàn toàn vấn đề "wall of text".
  - Giữ Sidebar bên trái (Agent Pipeline) như một "Mục lục" giúp người dùng theo dõi và click vào để tự động cuộn đến tin nhắn tương ứng (bằng Auto-scroll tạm dừng thông minh). Tích hợp hiệu ứng **Highlight/Blink** trong 2 giây để focus vào tin nhắn vừa được target.
  - Tối ưu UI cho Sidebar: Cập nhật Icon riêng biệt cho từng Agent, tinh chỉnh typography, thêm hover scale effects và định dạng lại thời gian execution.
  - Sidebar bên trái có thể Toggle (đóng/mở) theo nhu cầu. Khi đóng, nó ẩn hoàn toàn (`width = 0`) để trả lại tối đa không gian màn hình cho khung phân tích. Nút toggle được đặt tinh tế ở góc Header.
  - Gỡ bỏ `ApprovalQueue` phức tạp ra khỏi tab này, thay bằng System Notification đơn giản kèm nút "Go to Control Tower" tự động chuyển hướng để duyệt kịch bản, giúp người dùng không bị phân mảnh sự tập trung.

## Next Steps (UX Review)
- Rà soát kiểm tra contrast/spacing, thêm các hiệu ứng micro-interactions (hover, active states).
- Nghiên cứu và bổ sung sticky action bar cho các thao tác chính.
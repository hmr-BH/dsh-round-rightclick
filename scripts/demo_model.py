"""本地演示模型：只返回预设文案，不连接外部服务、不调用工具。"""

import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class DemoModelHandler(BaseHTTPRequestHandler):
    """提供演示所需的模型列表和流式文本响应。"""

    def log_message(self, format, *args):
        """不在日志记录请求头或会话正文。"""
        return

    def do_GET(self):
        """返回本地可用模型列表。"""
        data = {"object": "list", "data": [{"id": "deepseek-v4-flash", "object": "model", "owned_by": "local-demo"}]}
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        """按演示问题返回固定回答，流式输出用于展示真实打断流程。"""
        size = int(self.headers.get("Content-Length", "0"))
        request = json.loads(self.rfile.read(size))
        messages = request.get("messages", [])
        text = str(next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), ""))
        slow = "30 项" in text
        if slow:
            answer = "## 活动执行检查清单\n\n" + "\n\n".join(f"{n}. **检查事项 {n}**：确认页面文案、报名流程与视觉样式一致，并记录验收结果。" for n in range(1, 31))
        elif "报名按钮" in text:
            answer = "## 让报名更轻松\n\n**主按钮**：加入这场夏日灵感集\n\n**辅助文案**：留下邮箱，活动开启前提醒你。\n\n### 常见问题\n\n- **适合谁参加？** 对设计和创意感兴趣的每个人。\n- **需要准备什么？** 带上好奇心，其他交给我们。\n- **如何收到通知？** 报名成功后，我们会发送活动安排。\n\n这版沿用蓝绿色视觉和三段式结构。"
        elif "蓝绿色" in text:
            answer = "## 视觉方向：清爽、明亮、有呼吸感\n\n**主色**：海盐蓝 × 薄荷绿，以大面积留白衬托重点。\n\n### 保留三段式结构\n\n1. **第一屏**：一句邀请 + 活动日期 + 报名按钮。\n2. **中间段**：用三张卡片呈现工作坊、分享和自由交流。\n3. **收尾段**：报名入口与简短 FAQ，减少操作负担。\n\n按钮采用圆角和轻微反馈，标题保持清晰，装饰保持克制。"
        else:
            answer = "## 夏日灵感集\n\n一个让创意自然发生的活动页面。\n\n### 页面结构\n\n1. **相遇**：用一句邀请和一张主视觉，快速说明活动主题。\n2. **探索**：展示三项值得期待的内容——工作坊、灵感分享和自由交流。\n3. **加入**：将报名入口放在结尾，附上日期、地点和常见问题。\n\n建议先把信息顺序确定，再探索不同的视觉方向。"
        self.send_response(200)
        if not request.get("stream", False):
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {"id": "demo", "object": "chat.completion", "model": "deepseek-v4-flash", "choices": [{"index": 0, "message": {"role": "assistant", "content": answer}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 120, "completion_tokens": 150, "total_tokens": 270}}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
            return
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            for offset in range(0, len(answer), 8):
                chunk = {"id": "demo", "object": "chat.completion.chunk", "model": "deepseek-v4-flash", "choices": [{"index": 0, "delta": {"content": answer[offset:offset + 8]}, "finish_reason": None}]}
                self.wfile.write(("data: " + json.dumps(chunk, ensure_ascii=False) + "\n\n").encode())
                self.wfile.flush()
                time.sleep(0.12 if slow else 0.012)
            end = {"id": "demo", "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}], "usage": {"prompt_tokens": 120, "completion_tokens": 150, "total_tokens": 270}}
            self.wfile.write(("data: " + json.dumps(end) + "\n\ndata: [DONE]\n\n").encode())
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass


if __name__ == "__main__":
    print("本地演示模型已启动：127.0.0.1:3082", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 3082), DemoModelHandler).serve_forever()

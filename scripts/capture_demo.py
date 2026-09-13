"""用独立浏览器采集插件实机素材；所有临时文件保存在不发布的 artifacts 目录。"""

import argparse
import asyncio
import json
import re
from pathlib import Path


async def inspect_page(url: str, stage: str) -> None:
    """打开演示页面并保存检查截图，输出可见控件名称以便安排实际操作。"""
    from playwright.async_api import async_playwright

    root = Path(__file__).resolve().parent.parent
    output = root / "artifacts" / "capture"
    output.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(channel="msedge", headless=False)
        state_file = output / "browser-state.json"
        context = await browser.new_context(viewport={"width": 1600, "height": 900}, locale="zh-CN", color_scheme="dark", storage_state=str(state_file) if state_file.exists() else None)
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        if stage in {"workspace", "create"}:
            notice = page.get_by_role("button", name="继续", exact=True)
            if await notice.is_visible():
                await notice.click()
            await page.get_by_role("button", name="选择工作区", exact=True).click()
            await page.wait_for_timeout(400)
            if stage == "create":
                await page.get_by_role("button", name="编辑路径", exact=True).click()
                path_field = page.get_by_role("textbox", name="编辑路径", exact=True)
                await path_field.fill(str(root / "artifacts" / "showcase"))
                await path_field.press("Enter")
                await page.get_by_role("button", name="打开", exact=True).click()
                await page.wait_for_timeout(800)
        if stage == "prepare":
            prompts = [
                "为「夏日灵感集」设计一个活动落地页，先给出页面结构。",
                "把视觉方向改为清爽的蓝绿色，保留三段式结构。",
                "进一步写出报名按钮和FAQ文案，保持轻松语气。",
            ]
            for number, prompt in enumerate(prompts, 1):
                await page.locator('[contenteditable="true"]').fill(prompt)
                await page.get_by_role("button", name="发送消息", exact=True).click()
                await page.wait_for_timeout(4500)
                await page.wait_for_timeout(600)
                print(f"已准备第 {number} 轮演示对话", flush=True)
        await page.screenshot(path=str(output / "inspect.png"))
        controls = await page.locator("button").evaluate_all("els => els.slice(0,45).map(e=>({text:e.textContent,aria:e.getAttribute('aria-label'),title:e.title}))")
        fields = await page.locator("input,textarea,[contenteditable=true]").evaluate_all("els=>els.map(e=>({tag:e.tagName,placeholder:e.getAttribute('placeholder'),role:e.getAttribute('role'),'aria-label':e.getAttribute('aria-label')}))")
        print(json.dumps({"title": await page.title(), "buttons": controls, "fields": fields, "text": (await page.locator('body').inner_text())[:4500]}, ensure_ascii=False))
        await context.storage_state(path=str(output / "browser-state.json"))
        await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", help="已启动的独立演示页面地址")
    parser.add_argument("--log-file", default="artifacts/demo-dsh.log", help="用于读取演示实例的访问地址，避免将令牌写入命令行")
    parser.add_argument("--stage", default="inspect", choices=["inspect", "workspace", "create", "prepare"])
    args = parser.parse_args()
    url = args.url
    if not url:
        match = re.search(r"http://127\.0\.0\.1:3081/\?token=[^\s]+", Path(args.log_file).read_text(encoding="utf-8"))
        if not match:
            raise SystemExit("演示服务日志中没有可用访问地址")
        url = match.group(0)
    asyncio.run(inspect_page(url, args.stage))

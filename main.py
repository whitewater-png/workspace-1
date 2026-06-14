import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
from lm_studio_handler import LMStudioHandler
import asyncio

load_dotenv()

# Discord Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# LM Studio handler
lm_handler = LMStudioHandler()

@bot.event
async def on_ready():
    print(f"✅ Bot is ready! Logged in as {bot.user}")
    # Check LM Studio connection
    connected = await lm_handler.check_connection()
    if connected:
        print("✅ LM Studio に接続しました")
    else:
        print("⚠️ LM Studio に接続できません。サーバーが起動していることを確認してください。")

@bot.command(name="ask")
async def ask_claude(ctx, *, question: str):
    """Ask a question to Claude via LM Studio"""
    async with ctx.typing():
        response = await lm_handler.generate_response(question)

        if response:
            # Discord の message limit (2000文字) に対応
            if len(response) > 2000:
                chunks = [response[i:i+2000] for i in range(0, len(response), 2000)]
                for chunk in chunks:
                    await ctx.send(chunk)
            else:
                await ctx.send(response)
        else:
            await ctx.send("❌ レスポンスを生成できませんでした。")

@bot.command(name="code")
async def generate_code(ctx, language: str = "python", *, description: str):
    """Generate code from description"""
    async with ctx.typing():
        code = await lm_handler.generate_code(description, language)

        if code:
            # Format as code block
            formatted_code = f"```{language}\n{code}\n```"
            if len(formatted_code) > 2000:
                chunks = [formatted_code[i:i+2000] for i in range(0, len(formatted_code), 2000)]
                for chunk in chunks:
                    await ctx.send(chunk)
            else:
                await ctx.send(formatted_code)
        else:
            await ctx.send("❌ コードを生成できませんでした。")

@bot.command(name="summarize")
async def summarize(ctx, *, text: str):
    """Summarize text"""
    async with ctx.typing():
        summary = await lm_handler.process_text(text, task="summarize")

        if summary:
            if len(summary) > 2000:
                chunks = [summary[i:i+2000] for i in range(0, len(summary), 2000)]
                for chunk in chunks:
                    await ctx.send(chunk)
            else:
                await ctx.send(summary)
        else:
            await ctx.send("❌ 要約を生成できませんでした。")

@bot.command(name="translate")
async def translate(ctx, *, text: str):
    """Translate text to Japanese"""
    async with ctx.typing():
        translation = await lm_handler.process_text(text, task="translate")

        if translation:
            if len(translation) > 2000:
                chunks = [translation[i:i+2000] for i in range(0, len(translation), 2000)]
                for chunk in chunks:
                    await ctx.send(chunk)
            else:
                await ctx.send(translation)
        else:
            await ctx.send("❌ 翻訳を生成できませんでした。")

@bot.command(name="help_claude")
async def help_claude(ctx):
    """Show available commands"""
    embed = discord.Embed(
        title="🤖 Claude Discord Bot - コマンド一覧",
        description="LM Studio 経由で Gemma2 を使用しています",
        color=discord.Color.blue()
    )

    embed.add_field(
        name="!ask <質問>",
        value="質問に答えます",
        inline=False
    )
    embed.add_field(
        name="!code [言語] <説明>",
        value="コードを生成します（例: `!code python リスト処理関数を作成`）",
        inline=False
    )
    embed.add_field(
        name="!summarize <テキスト>",
        value="テキストを要約します",
        inline=False
    )
    embed.add_field(
        name="!translate <テキスト>",
        value="テキストを日本語に翻訳します",
        inline=False
    )

    await ctx.send(embed=embed)

if __name__ == "__main__":
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        print("❌ エラー: DISCORD_TOKEN が設定されていません")
        print("   .env ファイルに DISCORD_TOKEN を設定してください")
        exit(1)

    bot.run(token)

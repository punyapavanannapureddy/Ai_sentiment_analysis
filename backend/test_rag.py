import asyncio
from rag.pipeline import rag_query

async def main():
    result = await rag_query("How is the camera quality?")
    print("ANSWER:", result["answer"])
    print("DOCS:", result["docs_retrieved"])

asyncio.run(main())

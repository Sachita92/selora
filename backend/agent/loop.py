# agent/loop.py
# The agent loop — runs Selora on a schedule
# In production this runs every hour via a scheduler
# For now you can run it manually to test

import time
from datetime import datetime
from adapters.base import BaseAdapter
from agent.brain import SeloraBrain


def run_once(adapter: BaseAdapter, dry_run: bool = False) -> dict:
    """
    Run one full agent cycle:
    1. Fetch store data
    2. Agent analyzes and acts
    3. Return results

    dry_run=True → agent thinks and reports but makes NO real changes
    """

    started_at = datetime.now()
    print(f"\n{'='*60}")
    print(f"🌱 SELORA AGENT CYCLE STARTED")
    print(f"   Time: {started_at.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Platform: {adapter.get_platform_name()}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}")

    try:
        # Step 1: Fetch store data
        snapshot = adapter.get_store_snapshot()

        # Step 2: Agent thinks and acts
        brain = SeloraBrain(adapter=adapter, dry_run=dry_run)
        actions = brain.think_and_act(snapshot)

        # Step 3: Log results
        finished_at = datetime.now()
        duration = (finished_at - started_at).seconds

        print(f"\n{'='*60}")
        print(f"✅ CYCLE COMPLETE")
        print(f"   Duration: {duration}s")
        print(f"   Actions taken: {len(actions)}")
        print(f"{'='*60}\n")

        return {
            "success": True,
            "started_at": started_at.isoformat(),
            "finished_at": finished_at.isoformat(),
            "duration_seconds": duration,
            "platform": adapter.get_platform_name(),
            "shop": snapshot.shop_name,
            "actions_count": len(actions),
            "actions": actions,
        }

    except Exception as e:
        print(f"\n❌ CYCLE FAILED: {e}")
        return {
            "success": False,
            "error": str(e),
            "started_at": started_at.isoformat(),
        }


def run_forever(adapter: BaseAdapter, interval_minutes: int = 60, dry_run: bool = False):
    """
    Run the agent on a loop every N minutes.
    This is what runs in production on your server.

    interval_minutes=60 means the agent runs every hour.
    """

    print(f"\n🔄 Selora running in loop mode — every {interval_minutes} minutes")
    print(f"   Press Ctrl+C to stop\n")

    cycle = 0
    while True:
        cycle += 1
        print(f"\n--- Cycle #{cycle} ---")

        result = run_once(adapter=adapter, dry_run=dry_run)

        if result["success"]:
            print(f"💤 Sleeping for {interval_minutes} minutes until next cycle...")
        else:
            print(f"⚠️  Cycle failed. Retrying in {interval_minutes} minutes...")

        time.sleep(interval_minutes * 60)
import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim import Config, Simulator, State


class SimTest(unittest.TestCase):
    def make(self, **cfg):
        sim = Simulator(State())
        sim.configure(seed=1, **cfg)
        return sim

    def test_reaches_exact_targets(self):
        for curve in ("linear", "accelerating", "logistic", "viral"):
            sim = self.make(target_views=50_000, target_subs=2_000, views_per_hour=900,
                            subs_per_hour=40, curve=curve)
            sim.step(24 * 365)
            s = sim.state
            self.assertTrue(s.done, curve)
            self.assertEqual(s.gained_views, 50_000, curve)
            self.assertEqual(s.gained_subs, 2_000, curve)
            self.assertEqual(sum(v.views for v in s.videos), 50_000, curve)

    def test_linear_rate_without_noise(self):
        sim = self.make(target_views=10**9, target_subs=10**9, views_per_hour=100,
                        subs_per_hour=5, noise_pct=0)
        sim.step(10)
        self.assertEqual((sim.state.views, sim.state.subs), (1000, 50))

    def test_accelerating_grows(self):
        sim = self.make(target_views=10**9, target_subs=10**9, views_per_hour=100,
                        curve="accelerating", accel_pct_per_day=50, noise_pct=0)
        sim.step(48)
        h = sim.state.history
        self.assertGreater(h[-1]["dv"], h[0]["dv"])

    def test_new_target_counts_from_current(self):
        sim = self.make(target_views=100, target_subs=0, views_per_hour=1000)
        sim.step(5)
        sim.configure(target_views=200)
        sim.step(5)
        self.assertEqual(sim.state.views, 300)

    def test_save_load_roundtrip(self):
        sim = self.make(target_views=5000, views_per_hour=300)
        sim.step(7)
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "s.json"
            sim.state.save(p)
            self.assertEqual(State.load(p).stats(), sim.state.stats())

    def test_validation(self):
        with self.assertRaises(ValueError):
            Config(curve="nope").validate()
        with self.assertRaises(ValueError):
            Config(target_views=-1).validate()


if __name__ == "__main__":
    unittest.main()

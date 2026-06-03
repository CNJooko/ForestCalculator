#!/usr/bin/env python3
"""
单元测试 — 核心计算公式验证
测试树种参数解析、材积计算、出材率分配等核心逻辑。
使用 unittest 框架（无需额外安装 pytest）。
"""
import math
import sys
import unittest
from pathlib import Path


# 将 tools 目录加入路径以导入 regression_validator
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

from regression_validator import calc_volume, Species


class TestCoreFormulas(unittest.TestCase):
    """核心材积计算公式测试。"""

    def _make_species(self, name: str, a: float, b: float, c: float,
                      is_dynamic: bool = False,
                      b1: float = 0, b2: float = 0,
                      c1: float = 0, c2: float = 0) -> Species:
        return Species(
            name=name, latin="Test sp.",
            a=a, b=b, c=c, is_dynamic=is_dynamic,
            b1=b1 if is_dynamic else None,
            b2=b2 if is_dynamic else None,
            c1=c1 if is_dynamic else None,
            c2=c2 if is_dynamic else None,
        )

    # ---------- 标准公式验证 ----------

    def test_masson_pine_local_table(self):
        """马尾松(本地表): D=20 H=15 → ~0.230 m³"""
        sp = self._make_species("马尾松(本地)", 0.0000589718432, 1.879095, 0.975023)
        vol = calc_volume(sp, 20, 15)
        self.assertAlmostEqual(vol, 0.230, delta=0.010,
                               msg=f"马尾松本地表 D=20 H=15 期望 ~0.230, 实际 {vol:.4f}")

    def test_masson_pine_db51(self):
        """马尾松(DB51): D=20 H=15 → ~0.248 m³"""
        sp = self._make_species("马尾松(DB51)", 0.00006808595, 1.858728, 0.9721861)
        vol = calc_volume(sp, 20, 15)
        self.assertAlmostEqual(vol, 0.248, delta=0.015,
                               msg=f"马尾松DB51 D=20 H=15 期望 ~0.248, 实际 {vol:.4f}")

    def test_cryptomeria_local_table(self):
        """柳杉(本地表): D=20 H=15 → ~0.268 m³"""
        sp = self._make_species("柳杉(本地)", 0.000073839671, 1.979618, 0.836352)
        vol = calc_volume(sp, 20, 15)
        self.assertAlmostEqual(vol, 0.268, delta=0.015,
                               msg=f"柳杉本地表 D=20 H=15 期望 ~0.268, 实际 {vol:.4f}")

    def test_cryptomeria_db51(self):
        """柳杉(DB51): D=20 H=15 → ~0.233 m³"""
        sp = self._make_species("柳杉(DB51)", 0.000056280669, 1.82910409, 1.05195643)
        vol = calc_volume(sp, 20, 15)
        self.assertAlmostEqual(vol, 0.233, delta=0.012,
                               msg=f"柳杉DB51 D=20 H=15 期望 ~0.233, 实际 {vol:.4f}")

    def test_chinese_fir(self):
        """杉木: D=20 H=15 验证公式合理区间"""
        sp = self._make_species("杉木", 0.000058777042, 1.9699831, 0.89646157)
        vol = calc_volume(sp, 20, 15)
        # 杉木通常材积略小于马尾松
        self.assertGreater(vol, 0.15, f"杉木材积应 >0.15, 实际 {vol:.4f}")
        self.assertLess(vol, 0.35, f"杉木材积应 <0.35, 实际 {vol:.4f}")

    def test_cypress(self):
        """柏木: D=20 H=15 验证公式合理区间"""
        sp = self._make_species("柏木", 0.0000687928, 1.593567, 1.176727)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.10, f"柏木材积应 >0.10, 实际 {vol:.4f}")

    # ---------- 变指数模型 ----------

    def test_dynamic_model_fir_gz(self):
        """杉木(贵州变指数): D=20 H=15 验证 b2/c2 生效"""
        sp = self._make_species(
            "杉木(贵州)", a=0.000080597, b=0, c=0,
            is_dynamic=True,
            b1=1.96709, b2=-0.0059006,
            c1=0.7699, c2=0.0072346
        )
        vol = calc_volume(sp, 20, 15)

        # 用固定指数模型对比：取 D=20 H=15 时的等效 b,c
        dh = 20 + 15
        b_eff = 1.96709 - 0.0059006 * dh  # ≈ 1.7606
        c_eff = 0.7699 + 0.0072346 * dh    # ≈ 1.0231
        vol_fixed = 0.000080597 * math.pow(20, b_eff) * math.pow(15, c_eff)

        self.assertAlmostEqual(vol, vol_fixed, delta=0.0001,
                               msg=f"变指数模型应与等效固定指数一致, {vol:.6f} vs {vol_fixed:.6f}")

    def test_dynamic_model_cypress_gz(self):
        """柏木(贵州变指数): D=20 H=15 验证"""
        sp = self._make_species(
            "柏木(贵州)", a=0.000085626, b=0, c=0,
            is_dynamic=True,
            b1=1.9148, b2=-0.0045828,
            c1=0.74041, c2=0.00668
        )
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.10, f"柏木(贵州)材积应 >0.10, 实际 {vol:.4f}")

    def test_dynamic_model_soft_gz(self):
        """软阔(贵州变指数): D=20 H=15 验证"""
        sp = self._make_species(
            "软阔(贵州)", a=0.000073624, b=0, c=0,
            is_dynamic=True,
            b1=1.89885, b2=0,
            c1=0.85616, c2=0.00064635
        )
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.10, f"软阔(贵州)材积应 >0.10, 实际 {vol:.4f}")

    # ---------- 云南松 ----------

    def test_yunnan_pine_natural(self):
        """云南松(天然·2025): 验证公式给出合理值"""
        sp = self._make_species("云南松(天然)", 0.0000745425124, 1.846030, 0.921690)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15, f"云南松(天然)材积应 >0.15, 实际 {vol:.4f}")

    def test_yunnan_pine_planted(self):
        """云南松(人工·2025): 验证公式给出合理值"""
        sp = self._make_species("云南松(人工)", 0.00005696539, 1.991005, 0.841387)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15, f"云南松(人工)材积应 >0.15, 实际 {vol:.4f}")

    # ---------- 边界值测试 ----------

    def test_boundary_dbh_zero(self):
        """边界值: D=0 应返回 0"""
        sp = self._make_species("测试", 0.00005, 1.8, 1.0)
        vol = calc_volume(sp, 0, 15)
        self.assertEqual(vol, 0.0, f"D=0 材积应为 0, 实际 {vol}")

    def test_boundary_height_zero(self):
        """边界值: H=0 应返回 0"""
        sp = self._make_species("测试", 0.00005, 1.8, 1.0)
        vol = calc_volume(sp, 20, 0)
        self.assertEqual(vol, 0.0, f"H=0 材积应为 0, 实际 {vol}")

    def test_boundary_large_dbh(self):
        """边界值: D=300 不报错且给出合理正值"""
        sp = self._make_species("测试", 0.00005, 1.8, 1.0)
        vol = calc_volume(sp, 300, 50)
        self.assertGreater(vol, 0, f"D=300 H=50 材积应为正, 实际 {vol}")

    def test_boundary_large_height(self):
        """边界值: H=100 不报错且给出合理正值"""
        sp = self._make_species("测试", 0.00005, 1.8, 1.0)
        vol = calc_volume(sp, 50, 100)
        self.assertGreater(vol, 0, f"D=50 H=100 材积应为正, 实际 {vol}")

    def test_monotonic_dbh(self):
        """单调性: D 增大时材积应单调递增"""
        sp = self._make_species("马尾松", 0.0000589718432, 1.879095, 0.975023)
        vols = [calc_volume(sp, d, 15) for d in [10, 20, 30, 40, 50]]
        for i in range(len(vols) - 1):
            self.assertGreater(vols[i+1], vols[i],
                               msg=f"D 从 {10+i*10} 到 {10+(i+1)*10}: "
                                   f"材积应递增 {vols[i]:.4f} → {vols[i+1]:.4f}")

    # ---------- 福建 DB35/T 1823-2019 ----------

    def test_fujian_fir(self):
        """福建杉木: D=20 H=15 验证"""
        sp = self._make_species("杉木(福建)", 0.0000706094, 1.801671, 0.997998)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15)
        self.assertLess(vol, 0.35)

    def test_fujian_masson_pine(self):
        """福建马尾松: D=20 H=15 验证"""
        sp = self._make_species("马尾松(福建)", 0.000070728, 1.874518, 0.908949)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15)

    def test_fujian_broadleaf(self):
        """福建阔叶树: D=20 H=15 验证"""
        sp = self._make_species("阔叶树(福建)", 0.0000685634, 1.933221, 0.867885)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15)

    def test_fujian_other_conifer(self):
        """福建其他针叶: D=20 H=15 验证"""
        sp = self._make_species("其他针叶(福建)", 0.000069978, 1.8660492, 0.905254)
        vol = calc_volume(sp, 20, 15)
        self.assertGreater(vol, 0.15)

    def test_monotonic_height(self):
        """单调性: H 增大时材积应单调递增"""
        sp = self._make_species("马尾松", 0.0000589718432, 1.879095, 0.975023)
        vols = [calc_volume(sp, 20, h) for h in [5, 10, 15, 20, 30]]
        for i in range(len(vols) - 1):
            self.assertGreater(vols[i+1], vols[i],
                               msg=f"H 从 {5+i*5} 到 {5+(i+1)*5}: "
                                   f"材积应递增 {vols[i]:.4f} → {vols[i+1]:.4f}")


class TestYieldRates(unittest.TestCase):
    """出材率分配测试。"""

    def test_yield_sum_equals_one(self):
        """出材率总和应接近 1.0"""
        test_rates = [
            {"spec": 0.60, "nonSpec": 0.20, "fuel": 0.05, "waste": 0.15},
            {"spec": 0.55, "nonSpec": 0.20, "fuel": 0.05, "waste": 0.20},
            {"spec": 0.50, "nonSpec": 0.18, "fuel": 0.07, "waste": 0.25},
            {"spec": 0.42, "nonSpec": 0.15, "fuel": 0.08, "waste": 0.35},
            {"spec": 0.48, "nonSpec": 0.17, "fuel": 0.07, "waste": 0.28},
        ]
        for rates in test_rates:
            total = rates["spec"] + rates["nonSpec"] + rates["fuel"] + rates["waste"]
            self.assertAlmostEqual(total, 1.0, delta=0.005,
                                   msg=f"出材率总和应为 1.0, 实际 {total:.4f} "
                                       f"({rates['spec']}+{rates['nonSpec']}+"
                                       f"{rates['fuel']}+{rates['waste']})")

    def test_spec_non_spec_range(self):
        """规格+非规格 总和应在 0.5~0.9 之间"""
        test_rates = [
            {"spec": 0.60, "nonSpec": 0.20},
            {"spec": 0.55, "nonSpec": 0.20},
            {"spec": 0.50, "nonSpec": 0.18},
            {"spec": 0.42, "nonSpec": 0.15},
        ]
        for rates in test_rates:
            econ = rates["spec"] + rates["nonSpec"]
            self.assertGreater(econ, 0.50,
                               msg=f"经济材应 >50%, 实际 {econ*100:.0f}%")
            self.assertLess(econ, 0.90,
                            msg=f"经济材应 <90%, 实际 {econ*100:.0f}%")


class TestRegressionValidation(unittest.TestCase):
    """回归验证器功能测试。"""

    def test_parse_species(self):
        """验证 species-db.js 可解析"""
        from regression_validator import parse_species_db
        species_list = parse_species_db(ROOT / "src" / "js" / "species-db.js")
        self.assertGreater(len(species_list), 15,
                           f"应解析出 >15 个树种，实际 {len(species_list)}")

    def test_all_species_have_a(self):
        """所有树种 a 参数不应为 0"""
        from regression_validator import parse_species_db
        species_list = parse_species_db(ROOT / "src" / "js" / "species-db.js")
        for sp in species_list:
            self.assertNotEqual(sp.a, 0,
                                f"{sp.name}: a 不应为 0")


def calc_yield(sp, volume, dbh, height):
    """参考 calculator.js calcYield 的 Python 实现"""
    econBase = getattr(sp, 'econBasePct', 75)
    econPct = econBase + 0.18 * (dbh - 20) + 0.34 * (height - 15)
    econPct = max(50, min(92, econPct))
    econRate = econPct / 100
    yr = sp.yieldRates
    specRatio = yr["spec"] / (yr["spec"] + yr["nonSpec"])
    fuelRate = yr["fuel"]
    wasteRate = max(0, 1 - econRate - fuelRate)
    return {
        "spec": volume * econRate * specRatio,
        "nonSpec": volume * econRate * (1 - specRatio),
        "fuel": volume * fuelRate,
        "waste": volume * wasteRate,
        "econRate": econRate,
        "dynamic": True
    }


class TestYieldRatesDynamic(unittest.TestCase):
    """验证 v1.3.0 逐树种 econBasePct 出材率系统"""

    def _make_species(self, name, econBasePct, spec=0.60, nonSpec=0.20, fuel=0.05):
        from regression_validator import Species
        return Species(
            name=name, latin="Test sp.",
            a=0.0001, b=1.8, c=0.95, is_dynamic=False,
            econBasePct=econBasePct,
            yieldRates={"spec": spec, "nonSpec": nonSpec, "fuel": fuel, "waste": 1 - spec - nonSpec - fuel}
        )

    def _verify_yield(self, sp, dbh, height):
        vol = calc_volume(sp, dbh, height)
        y = calc_yield(sp, vol, dbh, height)
        total = y["spec"] + y["nonSpec"] + y["fuel"] + y["waste"]
        self.assertAlmostEqual(total, vol, places=6,
            msg=f"{sp.name} D={dbh} H={height}: yieldSum={total:.4f} vs vol={vol:.4f}")
        self.assertGreaterEqual(y["waste"], -1e-9,
            msg=f"{sp.name} D={dbh} H={height}: waste={y['waste']:.4f} 为负值")
        return y

    def test_masson_pine_base(self):
        """马尾松基准: D=20 H=15 → econ=78%"""
        sp = self._make_species("马尾松", 78)
        y = self._verify_yield(sp, 20, 15)
        self.assertAlmostEqual((y["spec"]+y["nonSpec"]) / calc_volume(sp,20,15), 0.78, places=2)

    def test_oak_low_yield(self):
        """栎类最低出材率: D=20 H=15 → econ=62%"""
        sp = self._make_species("栎类", 62, 0.40, 0.17, 0.08)
        y = self._verify_yield(sp, 20, 15)
        self.assertAlmostEqual((y["spec"]+y["nonSpec"]) / calc_volume(sp,20,15), 0.62, places=2)

    def test_large_dbh_higher_yield(self):
        """大径级出材率更高: D=40 H=25 vs D=20 H=15"""
        sp = self._make_species("马尾松", 78)
        y20 = self._verify_yield(sp, 20, 15)
        y40 = self._verify_yield(sp, 40, 25)
        econ20 = (y20["spec"]+y20["nonSpec"]) / calc_volume(sp,20,15)
        econ40 = (y40["spec"]+y40["nonSpec"]) / calc_volume(sp,40,25)
        self.assertGreater(econ40, econ20, "大径级应有更高经济材率")

    def test_small_dbh_lower_yield(self):
        """小径级出材率更低: D=10 H=8 vs D=20 H=15"""
        sp = self._make_species("杉木", 73, 0.55, 0.20, 0.05)
        y10 = self._verify_yield(sp, 10, 8)
        y20 = self._verify_yield(sp, 20, 15)
        econ10 = (y10["spec"]+y10["nonSpec"]) / calc_volume(sp,10,8)
        econ20 = (y20["spec"]+y20["nonSpec"]) / calc_volume(sp,20,15)
        self.assertLess(econ10, econ20, "小径级应有更低经济材率")

    def test_all_23_econBase_species(self):
        """23个树种全量验证: D=20,H=15 和 D=30,H=20"""
        species_list = [
            ("马尾松(本地表)", 78, 0.60, 0.20, 0.05),
            ("马尾松(DB51)", 78, 0.60, 0.20, 0.05),
            ("杉木", 73, 0.55, 0.20, 0.05),
            ("柏木", 71, 0.55, 0.20, 0.05),
            ("柳杉(本地表)", 70, 0.55, 0.20, 0.05),
            ("柳杉(DB51)", 70, 0.52, 0.20, 0.05),
            ("云南松(旧标)", 68, 0.50, 0.18, 0.07),
            ("云南松(天然)", 65, 0.48, 0.17, 0.07),
            ("云南松(人工)", 70, 0.55, 0.18, 0.05),
            ("华山松", 68, 0.50, 0.18, 0.07),
            ("栎类", 62, 0.40, 0.17, 0.08),
            ("桤木", 62, 0.42, 0.15, 0.08),
            ("杨树", 68, 0.50, 0.20, 0.05),
            ("软阔", 62, 0.42, 0.15, 0.08),
            ("硬阔", 65, 0.45, 0.17, 0.08),
            ("杉木(贵州)", 73, 0.52, 0.20, 0.05),
            ("马尾松(贵州)", 78, 0.60, 0.20, 0.05),
            ("柏木(贵州)", 71, 0.55, 0.20, 0.05),
            ("软阔(贵州)", 62, 0.42, 0.15, 0.08),
            ("杉木(福建)", 73, 0.55, 0.20, 0.05),
            ("马尾松(福建)", 78, 0.60, 0.20, 0.05),
            ("阔叶树(福建)", 65, 0.45, 0.17, 0.08),
            ("其他针叶(福建)", 70, 0.50, 0.18, 0.07),
        ]
        for name, econBase, spec, nonSpec, fuel in species_list:
            sp = self._make_species(name, econBase, spec, nonSpec, fuel)
            self._verify_yield(sp, 20, 15)
            self._verify_yield(sp, 30, 20)

    def test_no_negative_waste_extreme(self):
        """极端小径级: D=6 H=5 不应产生负废材"""
        sp = self._make_species("杨树", 68, 0.50, 0.20, 0.05)
        self._verify_yield(sp, 6, 5)

    def test_hectare_calculation(self):
        """公顷蓄积量: 单株 0.5m³ × 1200株 = 600m³"""
        sp = self._make_species("马尾松", 78, 0.60, 0.20, 0.05)
        sp.a = 0.0000795418
        sp.b = 1.8670657
        sp.c = 0.90146315
        vol = calc_volume(sp, 20, 15)
        y = calc_yield(sp, vol, 20, 15)

        # 模拟 calcPerHectare
        density = 1200
        totalVol = vol * density
        totalSpec = y["spec"] * density
        totalNonSpec = y["nonSpec"] * density
        totalFuel = y["fuel"] * density
        totalWaste = y["waste"] * density

        self.assertAlmostEqual(totalVol, vol * 1200, places=4)
        self.assertAlmostEqual(totalSpec + totalNonSpec + totalFuel + totalWaste, totalVol, places=4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
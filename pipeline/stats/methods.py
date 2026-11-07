"""Statistics for the Then vs Now claims (mentor item 10): pure functions, numpy + scipy only.

decade vs decade: difference of means, bootstrap 95% CI (resample years within each window, fixed seed), Welch's t-test,
Mann-Whitney U. Full-record trend: Mann-Kendall with the Hamed & Rao (1998) variance correction for autocorrelation, and
Sen's slope with its rank-based CI (Gilbert 1987) from the same corrected variance."""
from dataclasses import dataclass
import numpy as np
from scipy import stats

ALPHA = 0.05
DRAWS = 10_000
SEED = 20261102           # the mentor review's date: fixed, so every rerun gives the same intervals


@dataclass(frozen=True)
class Comparison:
    n_a: int
    n_b: int
    mean_a: float
    mean_b: float
    diff: float
    diff_ci: tuple[float, float]
    pct: float
    pct_ci: tuple[float, float]
    p_welch: float
    p_mann_whitney: float
    t: float
    u: float


def compare(a, b, draws=DRAWS, seed=SEED) -> Comparison:
    """Window B against window A (B - A). The bootstrap resamples years with replacement within each window."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    rng = np.random.default_rng(seed)
    ma = a[rng.integers(0, len(a), (draws, len(a)))].mean(axis=1)
    mb = b[rng.integers(0, len(b), (draws, len(b)))].mean(axis=1)
    lo, hi = 100 * ALPHA / 2, 100 * (1 - ALPHA / 2)
    diff_ci = tuple(float(v) for v in np.percentile(mb - ma, [lo, hi]))
    with np.errstate(divide="ignore", invalid="ignore"):
        pct_ci = tuple(float(v) for v in np.percentile((mb / ma - 1) * 100, [lo, hi]))
    w = stats.ttest_ind(b, a, equal_var=False)
    mw = stats.mannwhitneyu(b, a, alternative="two-sided")
    return Comparison(len(a), len(b), float(a.mean()), float(b.mean()), float(b.mean() - a.mean()), diff_ci,
                      float((b.mean() / a.mean() - 1) * 100), pct_ci, float(w.pvalue), float(mw.pvalue),
                      float(w.statistic), float(mw.statistic))


def clear_change(p_welch: float, p_mann_whitney: float, ci: tuple[float, float], alpha=ALPHA) -> bool:
    """The app's wording rule: a change is stated only if both tests agree (p < alpha) and the CI excludes 0."""
    return p_welch < alpha and p_mann_whitney < alpha and (ci[0] > 0 or ci[1] < 0)


@dataclass(frozen=True)
class Trend:
    n: int
    s: float
    z: float
    p: float
    tau: float
    slope: float
    slope_ci: tuple[float, float]
    lag1_autocorr: float
    variance_factor: float        # n/n* (1 = no correction)
    test: str


def _sign_sum(t, x):
    i, j = np.triu_indices(len(x), 1)
    return float(np.sign(x[j] - x[i]).sum()), (x[j] - x[i]) / (t[j] - t[i])


def _var_s(x):
    n = len(x)
    _, counts = np.unique(x, return_counts=True)
    ties = (counts * (counts - 1) * (2 * counts + 5)).sum()
    return (n * (n - 1) * (2 * n + 5) - ties) / 18


def _acf(x, lag):
    x = x - x.mean()
    d = (x * x).sum()
    return float((x[:-lag] * x[lag:]).sum() / d) if d else 0.0


def mann_kendall(t, x, alpha=ALPHA) -> Trend:
    """Mann-Kendall + Sen's slope on (t, x), t in years (gaps allowed). Hamed & Rao: detrend with Sen's slope, rank,
    and inflate Var(S) by the autocorrelations of the ranks that are significant at alpha (lags 1..n-1)."""
    t, x = np.asarray(t, float), np.asarray(x, float)
    order = np.argsort(t); t, x = t[order], x[order]
    n = len(x)
    s, slopes = _sign_sum(t, x)
    slope = float(np.median(slopes))
    var = _var_s(x)
    ranks = stats.rankdata(x - slope * t)
    bound = stats.norm.ppf(1 - alpha / 2) / np.sqrt(n)
    acc = 0.0
    for k in range(1, n - 2):
        r = _acf(ranks, k)
        if abs(r) > bound:
            acc += (n - k) * (n - k - 1) * (n - k - 2) * r
    factor = max(1 + 2 / (n * (n - 1) * (n - 2)) * acc, 1.0)   # never narrower than the plain test
    var_c = var * factor
    z = (s - np.sign(s)) / np.sqrt(var_c) if s else 0.0
    p = float(2 * (1 - stats.norm.cdf(abs(z))))
    c = stats.norm.ppf(1 - alpha / 2) * np.sqrt(var_c)
    srt = np.sort(slopes); m = len(srt)
    lo_i, hi_i = int(np.clip(np.floor((m - c) / 2) - 1, 0, m - 1)), int(np.clip(np.ceil((m + c) / 2), 0, m - 1))
    resid = x - slope * t
    return Trend(n, s, float(z), p, float(s / (n * (n - 1) / 2)), slope, (float(srt[lo_i]), float(srt[hi_i])),
                 _acf(resid, 1), float(factor), "Mann-Kendall, Hamed-Rao modified" if factor > 1 else "Mann-Kendall")

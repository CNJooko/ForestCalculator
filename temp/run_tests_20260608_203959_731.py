import unittest
import sys
sys.path.insert(0, '.')
suite = unittest.defaultTestLoader.discover('tests', pattern='test_*.py')
runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)
print(f'\n{"="*60}')
print(f'Tests: {result.testsRun} | OK: {result.testsRun - len(result.failures) - len(result.errors)} | FAIL: {len(result.failures)} | ERROR: {len(result.errors)}')
if result.failures:
    for t, _ in result.failures:
        print(f'  FAIL: {t}')
if result.errors:
    for t, _ in result.errors:
        print(f'  ERROR: {t}')

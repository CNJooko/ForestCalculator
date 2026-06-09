import unittest
suite = unittest.defaultTestLoader.discover('.', pattern='test_*.py')
runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)
print(f'\n{"="*60}')
print(f'Tests: {result.testsRun} | OK: {result.testsRun - len(result.failures) - len(result.errors)} | FAIL: {len(result.failures)} | ERROR: {len(result.errors)}')
if result.failures:
    for f, _ in result.failures:
        print(f'  FAIL: {f}')
if result.errors:
    for f, _ in result.errors:
        print(f'  ERROR: {f}')

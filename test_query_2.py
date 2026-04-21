from brain import VantageBrain
brain = VantageBrain()
res = brain.ask_data("where did aarav spend his money most?")
print(res['rows'][:2])
import pandas as pd
df = pd.DataFrame(res['rows'])
print(df.dtypes)

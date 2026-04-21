from brain import VantageBrain
brain = VantageBrain()
res = brain.ask_data("Give me spending by category")
print(res['rows'][:2])
import pandas as pd
df = pd.DataFrame(res['rows'])
print(df.dtypes)

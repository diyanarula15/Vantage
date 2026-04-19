import re

with open('/Users/apple/Desktop/vantage/Vantage/api.py', 'r') as f:
    text = f.read()

bad_snippet = """        _query_cache[cache_key] = resp
        return resp
        #
            answer=summary,
            sql=sql,
            data_quality=dq,
            plotly_config=plotly_config,
            rows=safe_rows,
            follow_up_questions=follow_ups
        )"""

good_snippet = """        _query_cache[cache_key] = resp
        return resp"""

bad_snippet2 = """        _simulate_cache[cache_key] = resp
        return resp
        # 
            answer=summary,
            original_sql=sql,
            simulated_sql=simulation_sql,
            plotly_config=plotly_config,
            rows=safe_rows,
            follow_up_questions=follow_ups
        )"""

text = text.replace(bad_snippet, good_snippet).replace(bad_snippet2, good_snippet)

with open('/Users/apple/Desktop/vantage/Vantage/api.py', 'w') as f:
    f.write(text)

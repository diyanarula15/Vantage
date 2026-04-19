import re

with open('/Users/apple/Desktop/vantage/Vantage/brain.py', 'r') as f:
    content = f.read()

# We replace _route_intent, _build_plan, _generate_sql with a single method _synthesize_sql_execution
new_method = """
    def _synthesize_sql_execution(
        self,
        query: str,
        schema: dict[str, Any],
        metric_dictionary: dict[str, Any],
        retrieval: dict[str, Any],
        date_bounds: dict[str, Any]
    ) -> dict[str, Any]:
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        prompt = f'''
You are a master SQLite synthesizer and analytics planner.
Analyze the user question and generate an execution plan and the final SQLite query.

Question: {query}
Temporal Rules: Real date is {current_date}, bounds {json.dumps(date_bounds)}
Schema: {json.dumps(schema, indent=2)}
GraphRAG Semantics: {json.dumps(retrieval, indent=2)}
Metric dictionary: {json.dumps(metric_dictionary, indent=2)}

Constraints:
- Determine intent: FACTUAL, DIAGNOSTIC, COMPARISON, or SUMMARY.
- If DIAGNOSTIC/COMPARISON, USE GROUP BY to break down metrics.
- MUST use column names exactly as they appear in schema.
- NEVER use single quotes for column names! Use double quotes (e.g. "Column Name").

Return JSON exactly as:
{{
  "intent": "FACTUAL",
  "plan_steps": ["step 1", "step 2"],
  "sql": "SELECT ..."
}}
'''
        payload = self.llm.json(prompt)
        return {
            "intent": payload.get("intent", "FACTUAL").strip().upper(),
            "plan_steps": [str(item) for item in payload.get("plan_steps", [])],
            "sql": payload.get("sql", "").strip()
        }
"""

# Replace the old methods (from def _route_intent to the end of def _generate_sql)
pattern = re.compile(r"    def _route_intent.*?    def _normalize_sql_value", re.DOTALL)
content = pattern.sub(new_method.strip() + "\n\n    def _normalize_sql_value", content)

# Now fix ask_data to use it
ask_data_pattern = re.compile(r"(intent = self._route_intent\(query\))(.*?)(plan_steps = self._build_plan\(query, schema, retrieval, date_bounds, intent\)\s+sql = self._generate_sql\(query, plan_steps, schema, metric_dictionary, retrieval, date_bounds, intent\))", re.DOTALL)

def replacement(match):
    part2 = match.group(2)
    # We remove the initial intent= clause, keep the embedding and cache logic, then replace the plan/sql generation.
    res = f'''        embedding = self.llm.embed_texts([query], input_type="search_query")[0]
        cached_sql, cache_distance = self._check_cache(embedding){part2}            synthesis = self._synthesize_sql_execution(query, schema, metric_dictionary, retrieval, date_bounds)
            intent = synthesis["intent"]
            plan_steps = synthesis["plan_steps"]
            sql = synthesis["sql"]
            if not sql: raise ValueError("Model did not return SQL")'''
    return res

content = ask_data_pattern.sub(replacement, content)

with open('/Users/apple/Desktop/vantage/Vantage/brain.py', 'w') as f:
    f.write(content)
print("brain.py patched successfully")

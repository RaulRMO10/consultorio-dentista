import os
from backend.config.supabase_client import get_supabase

def check_columns():
    try:
        sb = get_supabase()
        res = sb.table("agendamentos").select("*").limit(1).execute()
        if res.data:
            print("Columns in agendamentos:", list(res.data[0].keys()))
        else:
            print("No data in agendamentos table, cannot infer columns from a select.")
            
        res2 = sb.table("fin_faturamentos").select("*").limit(1).execute()
        if res2.data:
            print("Columns in fin_faturamentos:", list(res2.data[0].keys()))
        else:
            print("No data in fin_faturamentos.")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_columns()

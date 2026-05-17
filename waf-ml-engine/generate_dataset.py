import pandas as pd
import random

print("🧬 Generating Synthetic Master's Level Dataset...")

# 1. Base components for Normal Traffic
normal_paths = ["/index.html", "/about", "/contact", "/api/users", "/login", "/dashboard", "/products/item", "/checkout"]
normal_queries = ["?id=1", "?page=2", "?sort=asc", "?user=urmit", "?category=tech", ""]

# 2. Base components for Hacker Traffic (SQLi, XSS, Path Traversal, Command Injection)
malicious_payloads = [
    "' OR '1'='1", 
    "\" OR 1=1 --", 
    "UNION SELECT username, password FROM users", 
    "<script>alert(document.cookie)</script>", 
    "javascript:eval('var a=1')", 
    "../../../../etc/passwd", 
    "../../../windows/system32/cmd.exe", 
    "admin' --", 
    "?id=1; DROP TABLE users",
    "%3Cscript%3Ealert('XSS')%3C%2Fscript%3E",
    "onload=prompt(1)",
    "'; EXEC xp_cmdshell('dir');--"
]

dataset = []

# 3. Generate 4,000 Normal Requests (Label 0)
print("   -> Creating 4,000 Benign Requests...")
for _ in range(4000):
    path = random.choice(normal_paths)
    query = random.choice(normal_queries)
    # Add some random numbers to make it look like real dynamic traffic
    if query: query += str(random.randint(1, 999)) 
    dataset.append({"payload": path + query, "label": 0})

# 4. Generate 1,000 Malicious Requests (Label 1)
print("   -> Creating 1,000 Malicious Requests...")
for _ in range(1000):
    path = random.choice(normal_paths)
    attack = random.choice(malicious_payloads)
    
    # Sometimes the attack is in the URL, sometimes it's the whole path
    if random.choice([True, False]):
        payload = path + "?search=" + attack
    else:
        payload = "/" + attack
        
    dataset.append({"payload": payload, "label": 1})

# 5. Shuffle the data so the AI doesn't memorize the order
random.shuffle(dataset)

# 6. Save to a massive CSV
df = pd.DataFrame(dataset)
df.to_csv('csic_simulated_dataset.csv', index=False)

print(f"\n✅ Dataset complete! Generated {len(df)} rows of data.")
print("💾 Saved to 'csic_simulated_dataset.csv'")
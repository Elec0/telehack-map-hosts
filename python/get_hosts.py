import telnetlib
import re

def writeln(t, cmd):
    t.write((cmd + "\r\n").encode("ascii"))


def read_until(t, cond):
    return t.read_until(cond.encode("ascii")).decode()


def read_lazy(t):
    return t.read_very_lazy().decode()


HOST = "telehack.com"
tn = telnetlib.Telnet(HOST)

print("connected")
print(read_until(tn, "\r\n."))

writeln(tn, "hosts")
read_until(tn, "hosts")
hosts = []

while True:
    cur = read_until(tn, "--More--")
    percent = read_until(tn, ")")

    print(percent)
    hosts.append(cur)

    if "100" in percent:
        break
    writeln(tn, " ")

# Format hosts, remove bad data
format_hosts = []
for host in hosts:
    format_host = host.split("\r\n")

    for fh in format_host:
        fh = fh.strip()

        if "--More--" in fh or "[0m[1K" in fh or "---" in fh or \
                ("host" in fh and "organization" in fh and "location" in fh):
            pass
        else:
            fh = re.sub(r"[ ]{2,}", "\t", fh)
            format_hosts.append(fh)

with open('hosts-formatted.tsv', 'w') as f:
    for item in format_hosts:
        if item:
            f.write("%s\n" % item)

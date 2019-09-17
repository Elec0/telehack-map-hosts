import telnetlib
import csv


def writeln(t, cmd):
    t.write((cmd + "\r\n").encode("ascii"))


def read_until(t, cond):
    return t.read_until(cond.encode("ascii")).decode()


def read_lazy(t):
    return t.read_very_lazy().decode()


HOST = "telehack.com"
tn = telnetlib.Telnet(HOST)

read_until(tn, "\r\n.")

connections = {}
command = "uupath"

print("Getting connections for hosts.")
print("NOTE: This can be slow depending on your internet connection")
c = 1
m = sum(1 for row in csv.reader(open('hosts-formatted.tsv'), delimiter='\t'))

with open("hosts-formatted.tsv") as tsvfile:
    reader = csv.reader(tsvfile, delimiter='\t')

    for row in reader:
        writeln(tn, command + " " + row[0])
        read_until(tn, "\r\n")
        result = read_until(tn, "\r\n.")
        result = result.replace("\r\n.", "")
        print("({}/{}): {}".format(c, m, row[0]))
        c += 1
        connections[row[0]] = result

with open('connections.tsv', 'w') as f:
    for (host, path) in connections.items():
        f.write("{}\t{}\n".format(host.strip(), path.strip()))

print("Done getting connections")
print("Cleaning up connections")

saved = []
with open("connections.tsv") as tsvfile:
    reader = csv.reader(tsvfile, delimiter='\t')
    for row in reader:
        if len(row) == 2:
            saved.append(row)

with open('connections-formatted.csv', 'w') as f:
    for (host, path) in saved:
        f.write("{}, {}\n".format(host, path))

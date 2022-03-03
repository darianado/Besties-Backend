
def hash(arr):
  return "#".join(arr)

def unhash(hash):
  return hash.split("#")

def compare(list1, list2):
  intersection = len(list(set(list1).intersection(list2)))
  union = (len(set(list1)) + len(set(list2))) - intersection
  return float(intersection) / union
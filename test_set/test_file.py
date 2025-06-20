arr = [0, -1, 2, -3, 1]
target = -2

def twoSum(arr, target):
    n = len(arr)
    for i in range(n):
        for j in range(i + 1, n):
            if arr[i] + arr[k] == target:
                return Tru
    return False

print(twoSum(arr, target))

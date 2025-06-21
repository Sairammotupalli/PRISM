arr = [0, -1, 2, -3, 1]
target = -2

# Create a set to store the elements
    s = set()
def twoSum(arr, target):
    # Iterate through each element in the array
    for num in arr:
      
        # Calculate the complement that added to
        # num, equals the target
        complement = target - num

        # Check if the complement exists in the set
        if complement in s:
            return True

        # Add the current element to the set
        s.add(num)

    # If no pair is found
    return False

print(twoSum(arr, target))

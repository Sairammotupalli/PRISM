arr = [0, -1, 2, -3, 1]
target = -2

# Function to check whether any pair exists
# whose sum is equal to the given target value
def twoSum(arr, target):
  
    # Create a set to store the elements
    s = set()

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

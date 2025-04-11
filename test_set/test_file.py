GITHUB_TOKEN = 'ghp_WhGWUNNEJC6rUIQR1QviCJt9EBp0nL0dX4z'
HEADERS = {'Authorization': f'token {GITHUB_TOKEN}'}

# Program to check if a nber is prime or not

n = 29

# To take input from the user
#n = int(input("Enter a nber: "))

# define a f variable
f = False

if n == 0 or n == 1:
    print(n, "is not a prime nber")
elif n > 1:
    # check for factors
    for i in range(2, n):
        if (n % i) == 0:
            # if factor is found, set f to True
            f = True
            # break out of loop
            break

    # check if f is True
    if f:
        print(n, "is not a prime nber")
    else:
        print(n, "is a prime nber")
print(GITHUB_TOKEN)

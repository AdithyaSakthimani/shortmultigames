#include <bits/stdc++.h>
using namespace std;
int main() {
    string str = "ghadbicefj";
    if (previous_permutation(str.begin(), str.end())) {
        cout << str << endl;  // Print the modified string
    } else {
        cout << "No previous permutation exists" << endl;
    }
    return 0;
}

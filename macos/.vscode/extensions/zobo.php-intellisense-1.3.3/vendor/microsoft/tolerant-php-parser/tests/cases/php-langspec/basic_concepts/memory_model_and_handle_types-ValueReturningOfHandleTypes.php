/* Auto-generated from php/php-langspec tests */
<?php

function f2()
{
	$b = new Point(5, 7);	// create first new point, and make $b an alias to it

	echo "After 'new Point(5, 7)', \$b is $b\n";

	return $b;	// return a temporary copy, which is a new alias
				// However, as $b goes away, remove its alias
}

$a = f2();		// make a new alias in $a and remove the temporary alias

echo "After '\$a = f2()', \$a is $a\n";
unset($a);	// remove only alias from point, so destructor runs
echo "Done\n";
//*/

///*

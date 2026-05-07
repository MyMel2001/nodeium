y=$(date +%Y)
read -p "Nodeium # of year $y (1,2,3,4...):" v
npm run make
mkdir "Nodeium $y.$v"
mv nodeium-linux-* "Nodeium $y.$v"
mv nodeium-win32-* "Nodeium $y.$v"
tar -czvf "Nodeium $y.$v.tar.gz" "Nodeium $y.$v"
rm -rf "Nodeium $y.$v"
mkdir ~/nodeium-bins
mv "Nodeium $y.$v.tar.gz" ~/nodeium-bins
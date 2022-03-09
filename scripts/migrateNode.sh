
### credits to th33xitus for the script base
clear

### set color variables
green=$(echo -en "\e[92m")
yellow=$(echo -en "\e[93m")
red=$(echo -en "\e[91m")
cyan=$(echo -en "\e[96m")
default=$(echo -en "\e[39m")

status_msg(){
  echo; echo -e "${yellow}###### $1${default}"
}

ok_msg(){
  echo; echo -e "${green}>>>>>> $1${default}"
}

status_msg "Remove old Node Modules"
sudo rm -rf /usr/local/lib/node_modules

status_msg "Remove old Node Version"
sudo rm  /usr/local/bin/node

status_msg "Add NodeJS 16.x Repo"
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

status_msg "Install NodeJS 16.X"
sudo apt-get install -y nodejs

status_msg "Rebuild NPM"
npm rebuild
sudo npm rebuild
sudo npm rebuild -g

status_msg "Update NPM"
sudo npm install -g npm@latest node-gyp@latest

status_msg "Install Dependencies"
npm ci --only=prod

ok_msg "Please regenerate the Service with bash scripts/generateService.sh, if you used a custom path or service suffix, the arguments from the install script work also on the generate Service script"
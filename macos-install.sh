/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew bundle --file ~/.dotfiles/macos/Brewfile

ln -s ~/.dotfiles/macos/.config ~/.config
ln -s ~/.dotfiles/macos/.zshrc ~/
ln -s ~/.dotfiles/macos/.gitconfig ~/
ln -s ~/.dotfiles/macos/.vscode ~/ 
ln -s ~/.dotfiles/macos/.npm ~/

cd ~/.dotfiles

python3 -m ensurepip
python3 -m pip install --upgrade setuptools
python3 -m pip install --upgrade pip

npm i -g npm@latest

-- This file can be loaded by calling `lua require('plugins')` from your init.vim

-- Only required if you have packer configured as `opt`
vim.cmd [[packadd packer.nvim]]

return require('packer').startup(function(use)
 	-- Packer can manage itself
  	use 'wbthomason/packer.nvim'

  	-- Plugins under here
  	use {
  		'nvim-telescope/telescope.nvim', tag = '0.1.5',
		-- or                            , branch = '0.1.x',
  		requires = { {'nvim-lua/plenary.nvim'} }
	}
	use {
  		"folke/tokyonight.nvim",
  		lazy = false,
  		priority = 1000,
  		opts = {},
	}
end)

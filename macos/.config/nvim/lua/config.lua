-- Remaps
vim.g.mapleader = " "
vim.keymap.set("n", "<leader>pp", vim.cmd.Ex)
vim.keymap.set("n", "<leader>q", vim.cmd.Q)

vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

vim.keymap.set("n", "<leader>y", "\"+y")
vim.keymap.set("v", "<leader>y", "\"+y")
vim.keymap.set("n", "<leader>y", "\"+y")

-- Navigations
vim.keymap.set("n", "<C-f>", "<cmd>silent !tmux neww tmux-sessionizer<CR>")

vim.keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]])
vim.keymap.set("n", "<leader>x", "<cmd>!chmod +X %<CR>", { silent = true })

-- Plugins and Plugin Configuration
vim.cmd.colorscheme("tokyonight")

-- Formatting options

-- Set the tab space to 4 spaces per tab
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true

-- Set the line numbers to be relative
vim.opt.number = true
vim.opt.relativenumber = true

-- Set the cursor line to be highlighted
vim.opt.guicursor = "n-v-c:block,i-ci-ve:ver25,r-cr:hor20,o:hor50"

vim.opt.wrap = false

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undofile = true

vim.opt.termguicolors = true

vim.opt.scrolloff = 8
vim.opt.signcolumn = "yes"
vim.opt.isfname:append { "@-@" }
vim.opt.completeopt = "menuone,noselect"

